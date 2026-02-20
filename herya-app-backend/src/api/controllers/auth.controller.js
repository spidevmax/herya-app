const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../../utils/token");
const { deleteImgCloudinary } = require("../../utils/deleteImage");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

/**
 * Controller: registerUser
 * ------------------------
 * Handles user registration by creating a new user and returning an immediate authentication token.
 *
 * Workflow:
 * 1. Validates password length (minimum 8 characters).
 * 2. Checks if a user with the same email already exists.
 * 3. If user exists, deletes any uploaded image from Cloudinary and throws a 400 error.
 * 4. Creates a new User instance from `req.body`.
 * 5. If a profile image is uploaded, stores the Cloudinary URL and public ID.
 * 6. Initializes VK progression with Tadasana family unlocked (all users start here).
 * 7. Saves the user to the database.
 * 8. Generates JWT token for immediate authentication.
 * 9. Removes password from response and returns 201 with user data and token.
 *
 * Error Handling:
 * - 400 if password is less than 8 characters.
 * - 400 if user already exists (deletes uploaded image to avoid orphaned files).
 * - 404/400 if database save fails (deletes image to avoid orphaned files).
 * - All errors are passed to the global error handler via `next(error)`.
 *
 * Notes:
 * - Passwords are hashed automatically via a Mongoose pre-save hook.
 * - Email uniqueness is enforced both in the schema and manually checked here for better UX feedback.
 * - The imageUploaded flag prevents duplicate image deletion attempts.
 * - Profile image is optional during registration.
 * - New users start with Tadasana family unlocked by default.
 * - Returns both user data and token for immediate login (improved UX).
 */

const registerUser = async (req, res, next) => {
	let imageUploaded = false;

	try {
		const { email, password, name } = req.body;

		// Validate required fields
		if (!email || !password || !name) {
			throw createError(400, "Email, password, and name are required");
		}

		// Validate password length
		if (password.length < 8) {
			throw createError(400, "Password must be at least 8 characters long");
		}

		// Check if the email already exists BEFORE processing
		const userExist = await User.findOne({ email });
		if (userExist) {
			// Delete the uploaded image since user already exists
			if (req.file?.filename) {
				await deleteImgCloudinary(req.file.filename);
			}
			throw createError(400, "This email is already registered");
		}

		const user = new User(req.body);

		// Upload image to Cloudinary if provided
		if (req.file) {
			user.profileImageUrl = req.file.path; // Cloudinary URL
			user.profileImageId = req.file.filename; // Cloudinary public_id
			imageUploaded = true;
		}

		// Initialize VK progression with Tadasana unlocked (all users start here)
		user.vkProgression = {
			currentMainSequence: null,
			completedSequences: [],
			unlockedFamilies: ["tadasana"], // Everyone starts with Tadasana
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
 * Controller: loginUser
 * ---------------------
 * Authenticates a user by verifying their email and password, and returns a JWT.
 *
 * Workflow:
 * 1. Looks up the user by email from `req.body.email` (includes password field explicitly).
 * 2. If no user is found → throws a 404 error.
 * 3. Compares the provided password with the hashed password in the database using bcrypt.compare() (async).
 * 4. If credentials match → generates a JWT containing the user ID and email.
 * 5. Removes password from user object and returns a 200 response with user data and token.
 * 6. If password doesn't match → throws a 401 error.
 *
 * Error Handling:
 * - Throws a 404 error if the user is not found.
 * - Throws a 401 error if the password is incorrect.
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

const loginUser = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		// Validate required fields
		if (!email || !password) {
			throw createError(400, "Email and password are required");
		}

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
		next(error);
	}
};

module.exports = {
	registerUser,
	loginUser,
};
