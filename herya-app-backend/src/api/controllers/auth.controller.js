const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const { generateToken } = require("../../utils/token");
const { deleteImgCloudinary } = require("../../utils/deleteImage");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");
const {
	isSmtpConfigured,
	sendPasswordResetEmail,
} = require("../../utils/mailer");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const buildFrontendAuthRedirect = (query) => {
	const url = new URL("/auth/callback", FRONTEND_URL);
	Object.entries(query).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			url.searchParams.set(key, value);
		}
	});
	return url.toString();
};

const getGoogleAuthUrl = () => {
	if (!process.env.GOOGLE_CLIENT_ID) {
		throw createError(500, "GOOGLE_CLIENT_ID is not configured");
	}

	const redirectUri =
		process.env.GOOGLE_REDIRECT_URI ||
		`${process.env.BACKEND_URL || "http://localhost:3000"}/api/v1/auth/google/callback`;

	const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
	url.searchParams.set("redirect_uri", redirectUri);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("scope", "openid email profile");
	url.searchParams.set("access_type", "offline");
	url.searchParams.set("prompt", "select_account");

	return url.toString();
};

const exchangeGoogleCodeForUser = async (code) => {
	if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
		throw createError(500, "Google OAuth credentials are not configured");
	}

	const redirectUri =
		process.env.GOOGLE_REDIRECT_URI ||
		`${process.env.BACKEND_URL || "http://localhost:3000"}/api/v1/auth/google/callback`;

	const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			code,
			client_id: process.env.GOOGLE_CLIENT_ID,
			client_secret: process.env.GOOGLE_CLIENT_SECRET,
			redirect_uri: redirectUri,
			grant_type: "authorization_code",
		}),
	});

	if (!tokenResponse.ok) {
		throw createError(401, "Google token exchange failed");
	}

	const tokenPayload = await tokenResponse.json();
	if (!tokenPayload.access_token) {
		throw createError(401, "Google token exchange did not return access token");
	}

	const userInfoResponse = await fetch(
		"https://openidconnect.googleapis.com/v1/userinfo",
		{
			headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
		},
	);

	if (!userInfoResponse.ok) {
		throw createError(401, "Google user info could not be retrieved");
	}

	const profile = await userInfoResponse.json();

	if (!profile.email || !profile.email_verified) {
		throw createError(401, "Google account does not provide a verified email");
	}

	return profile;
};

const findOrCreateGoogleUser = async (profile) => {
	const email = profile.email.toLowerCase().trim();
	let user = await User.findOne({ email });

	if (!user) {
		const generatedPassword = crypto.randomBytes(32).toString("hex");
		user = new User({
			name: profile.name || email.split("@")[0],
			email,
			password: generatedPassword,
			profileImageUrl: profile.picture,
			vkProgression: {
				currentMainSequence: null,
				completedSequences: [],
			},
		});
	} else if (!user.profileImageUrl && profile.picture) {
		user.profileImageUrl = profile.picture;
	}

	await user.save();
	return user;
};

/**
 * Controller: register
 * ------------------------
 * Handles user registration by creating a new user and returning an immediate authentication token.
 *
 * Workflow:
 * 1. Request data is validated by registerValidations middleware (email, password, name required; password 8+ chars).
 * 2. handleValidationErrors middleware catches validation errors and deletes any uploaded image before responding.
 * 3. Checks if a user with the same email already exists.
 * 4. If user exists, deletes any uploaded image from Cloudinary and throws a 400 error.
 * 5. Creates a new User instance from `req.body`.
 * 6. If a profile image is uploaded, stores the Cloudinary URL and public ID.
 * 7. Initializes internal practice-history metadata.
 * 8. Saves the user to the database.
 * 9. Generates JWT token for immediate authentication.
 * 10. Removes password from response and returns 201 with user data and token.
 *
 * Error Handling:
 * - 400 if validation fails (handled by middleware, image automatically deleted).
 * - 400 if user already exists (deletes uploaded image to avoid orphaned files).
 * - 404/400 if database save fails (deletes image to avoid orphaned files).
 * - All errors are passed to the global error handler via `next(error)`.
 *
 * Notes:
 * - Passwords are hashed automatically via a Mongoose pre-save hook.
 * - Email uniqueness is enforced both in the schema and manually checked here for better UX feedback.
 * - The imageUploaded flag prevents duplicate image deletion attempts.
 * - Profile image is optional during registration.
 * - Practice history metadata is stored internally and not exposed as an access gate.
 * - Returns both user data and token for immediate login (improved UX).
 */

const register = async (req, res, next) => {
	let imageUploaded = false;

	try {
		const { email } = req.body;

		// Check if the email already exists BEFORE processing
		const userExist = await User.findOne({ email });

		if (userExist) {
			// Delete the uploaded image since user already exists
			if (req.file?.filename) {
				await deleteImgCloudinary(req.file.filename);
			}
			throw createError(400, "This user already exists");
		}

		const user = new User(req.body);

		// Upload image to Cloudinary if provided
		if (req.file) {
			user.profileImageUrl = req.file.path; // Cloudinary URL
			user.profileImageId = req.file.filename; // Cloudinary public_id
			imageUploaded = true;
		}

		// Initialize internal practice-history metadata
		user.vkProgression = {
			currentMainSequence: null,
			completedSequences: [],
		};

		const userDB = await user.save();

		// Generate JWT token for immediate login
		const token = generateToken(userDB._id, userDB.email);

		// Remove password from response
		const userResponse = userDB.toObject();
		delete userResponse.password;

		return sendResponse(res, 201, true, "User registered successfully", {
			user: userResponse,
			token,
		});
	} catch (error) {
		// Clean up image only if it was successfully assigned to user but save failed
		if (imageUploaded && error.status !== 400) {
			await deleteImgCloudinary(req.file.filename);
		}
		return next(error);
	}
};

/**
 * Controller: login
 * ---------------------
 * Authenticates a user by verifying their email and password, and returns a JWT.
 *
 * Workflow:
 * 1. Request data is validated by loginValidations middleware (email and password required).
 * 2. Looks up the user by email (includes password field explicitly).
 * 3. If no user is found → throws a 404 error.
 * 4. Compares the provided password with the hashed password in the database using bcrypt.compare() (async).
 * 5. If credentials match → generates a JWT containing the user ID and email.
 * 6. Removes password from user object and returns a 200 response with user data and token.
 * 7. If password doesn't match → throws a 401 error.
 *
 * Error Handling:
 * - 400 if validation fails (handled by middleware before this function).
 * - 404 error if the user is not found.
 * - 401 error if the password is incorrect.
 * - All errors are caught and forwarded to the global error handler via `next(error)`.
 *
 * Notes:
 * - Uses bcrypt.compare() for async password verification (non-blocking).
 * - The password field is excluded from User queries by default (select: false in schema),
 *   so it must be explicitly included with .select("+password").
 * - The generated token payload includes user ID and email for identification.
 * - Password is removed from the response for security.
 * - Returns both user data and token to client for convenient session management.
 */

const login = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		// Find user and explicitly include password field
		const user = await User.findOne({ email }).select("+password");

		if (!user) {
			throw createError(404, "User not found");
		}

		// Validate password
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			throw createError(401, "Invalid password");
		}

		// Generate JWT token
		const token = generateToken(user._id, user.email);

		// Remove password from response
		const userResponse = user.toObject();
		delete userResponse.password;

		return sendResponse(res, 200, true, "Login successful", {
			user: userResponse,
			token,
		});
	} catch (error) {
		return next(error);
	}
};

const me = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		if (!user) {
			throw createError(404, "User not found");
		}

		return sendResponse(
			res,
			200,
			true,
			"Authenticated user retrieved successfully",
			user,
		);
	} catch (error) {
		return next(error);
	}
};

const logout = async (_req, res, next) => {
	try {
		return sendResponse(res, 200, true, "Logout successful");
	} catch (error) {
		return next(error);
	}
};

const googleAuthStart = async (_req, res, next) => {
	try {
		const googleUrl = getGoogleAuthUrl();
		return res.redirect(googleUrl);
	} catch (error) {
		return next(error);
	}
};

const googleAuthCallback = async (req, res) => {
	try {
		const code = req.query.code;
		if (!code) {
			return res.redirect(
				buildFrontendAuthRedirect({ error: "missing_google_code" }),
			);
		}

		const profile = await exchangeGoogleCodeForUser(code);
		const user = await findOrCreateGoogleUser(profile);
		const token = generateToken(user._id, user.email);

		return res.redirect(buildFrontendAuthRedirect({ token }));
	} catch (_error) {
		return res.redirect(
			buildFrontendAuthRedirect({ error: "google_auth_failed" }),
		);
	}
};

const requestPasswordReset = async (req, res, next) => {
	try {
		const { email, locale = "es" } = req.body;
		const normalizedEmail = email.toLowerCase().trim();
		const user = await User.findOne({ email: normalizedEmail }).select(
			"+passwordResetToken +passwordResetExpires",
		);

		if (!user) {
			return sendResponse(
				res,
				200,
				true,
				"If the email exists, a password reset link has been generated",
				null,
			);
		}

		const resetToken = crypto.randomBytes(32).toString("hex");
		const hashedToken = crypto
			.createHash("sha256")
			.update(resetToken)
			.digest("hex");

		user.passwordResetToken = hashedToken;
		user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);
		await user.save();

		const resetUrl = new URL("/reset-password", FRONTEND_URL);
		resetUrl.searchParams.set("token", resetToken);

		const smtpConfigured = isSmtpConfigured();

		if (smtpConfigured) {
			await sendPasswordResetEmail({
				to: user.email,
				name: user.name,
				resetUrl: resetUrl.toString(),
				locale,
			});
		}

		const data =
			process.env.NODE_ENV === "production" || smtpConfigured
				? null
				: {
						resetUrl: resetUrl.toString(),
						expiresInMinutes: 30,
					};

		return sendResponse(
			res,
			200,
			true,
			"If the email exists, a password reset link has been generated",
			data,
		);
	} catch (error) {
		return next(error);
	}
};

const resetPassword = async (req, res, next) => {
	try {
		const { token, newPassword } = req.body;
		const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

		const user = await User.findOne({
			passwordResetToken: hashedToken,
			passwordResetExpires: { $gt: new Date() },
		}).select("+passwordResetToken +passwordResetExpires +password");

		if (!user) {
			throw createError(400, "Invalid or expired reset token");
		}

		user.password = newPassword;
		user.passwordResetToken = undefined;
		user.passwordResetExpires = undefined;
		await user.save();

		return sendResponse(res, 200, true, "Password reset successfully", null);
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	register,
	login,
	me,
	logout,
	googleAuthStart,
	googleAuthCallback,
	requestPasswordReset,
	resetPassword,
};
