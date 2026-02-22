const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const { deleteImgCloudinary } = require("../../utils/deleteImage");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

/**
 * Controller: getMyProfile
 * ------------------------
 * Retrieves the authenticated user's profile with populated VK progression data.
 *
 * Workflow:
 * 1. Uses `req.user._id` (set by authenticateToken middleware) to find the current user in the database.
 * 2. Excludes the password field using `.select("-password")`.
 * 3. Populates vkProgression references to get full sequence data.
 * 4. Returns a 200 response with the user's complete profile including VK progression details.
 *
 * Error Handling:
 * - Throws 404 if the user cannot be found.
 * - Any other errors are forwarded to the global error handler.
 *
 * Notes:
 * - Requires `authenticateToken` middleware to ensure `req.user` is available.
 * - Populates currentMainSequence and completedSequences with full Sequence objects.
 * - Ideal for displaying personal information on a “My Profile” page.
 */

const getMyProfile = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id)
			.select("-password")
			.populate("vkProgression.currentMainSequence.sequenceId")
			.populate("vkProgression.completedSequences.sequenceId");

		if (!user) {
			throw createError(404, "User not found");
		}

		return sendResponse(res, 200, true, "Profile retrieved successfully", user);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: updateMyProfile
 * ---------------------------
 * Allows the authenticated user to update their own profile information and preferences.
 *
 * Workflow:
 * 1. Finds the user using `req.user._id`.
 * 2. Prevents changes to restricted fields:
 *    - Cannot change `role` (throws 403).
 *    - Cannot change `password` here (must use `/users/change-password`).
 *    - Cannot change `vkProgression` (system-managed, throws 403).
 * 3. Updates allowed fields: `name`, `email`, `goals`, `preferences`, and profile image.
 * 4. Validates email uniqueness (checks no other user has that email).
 * 5. If a new image is uploaded, deletes the old one from Cloudinary after successful save.
 * 6. Saves and returns the updated user (excluding password).
 *
 * Error Handling:
 * - Throws 400 if email is already in use by another user.
 * - Throws 403 if the user tries to change restricted fields.
 * - Throws 404 if the user does not exist.
 * - Cleans up new image from Cloudinary if database save fails.
 *
 * Notes:
 * - Requires `authenticateToken` middleware.
 * - Uses `multer` with Cloudinary for image upload management.
 * - Returns sanitized user data without password.
 * - Deletes old image only after new save succeeds (prevents data loss).
 */

const updateMyProfile = async (req, res, next) => {
	let imageUploaded = false;
	let oldImageId = null;

	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			throw createError(404, "User not found");
		}

		// Prevent changing restricted fields
		if (req.body.role) {
			throw createError(403, "You are not allowed to change your role");
		}

		if (req.body.password) {
			throw createError(
				403,
				"You are not allowed to change your password here. Use /users/change-password instead",
			);
		}

		if (req.body.vkProgression) {
			throw createError(
				403,
				"VK progression is managed by the system and cannot be changed manually",
			);
		}

		// Store old image ID for cleanup
		oldImageId = user.profileImageId;

		// Update allowed fields
		if (req.body.name) {
			user.name = req.body.name.trim();
		}

		if (req.body.email) {
			// Check if email is already taken by another user
			const existingUser = await User.findOne({
				email: req.body.email.toLowerCase().trim(),
				_id: { $ne: req.user._id },
			});

			if (existingUser) {
				throw createError(400, "Email is already in use");
			}

			user.email = req.body.email.toLowerCase().trim();
		}

		// Update goals (array of strings)
		if (req.body.goals) {
			user.goals = req.body.goals;
		}

		// Update preferences (object)
		if (req.body.preferences) {
			user.preferences = {
				...user.preferences,
				...req.body.preferences,
			};
		}

		// Handle profile image update
		if (req.file) {
			user.profileImageUrl = req.file.path;
			user.profileImageId = req.file.filename;
			imageUploaded = true;
		}

		const updatedUser = await user.save();

		// Delete old image only after successful save
		if (imageUploaded && oldImageId) {
			await deleteImgCloudinary(oldImageId);
		}

		// Remove password from response
		const userResponse = updatedUser.toObject();
		delete userResponse.password;

		return sendResponse(res, 200, true, "Profile updated successfully", userResponse);
	} catch (error) {
		// Clean up new image if save failed
		if (imageUploaded && req.file?.filename) {
			await deleteImgCloudinary(req.file.filename);
		}
		return next(error);
	}
};

/**
 * Controller: updateMyPassword
 * ----------------------------
 * Allows the authenticated user to securely change their password.
 *
 * Workflow:
 * 1. Extracts `currentPassword`, `newPassword`, and `confirmPassword` from the request body (validated by middleware).
 * 2. Finds the user by `req.user._id` and explicitly includes the password field.
 * 3. Compares the provided current password with the stored (hashed) password using bcrypt.compare().
 * 4. If valid, assigns the new password — triggering the bcrypt pre-save hook for hashing.
 * 5. Saves the user to the database.
 * 6. Returns a 200 response with no sensitive data.
 *
 * Error Handling:
 * - 400 if validation fails (handled by changePasswordValidations middleware before this function).
 * - 401 if current password is incorrect.
 * - 404 if the user is not found.
 *
 * Notes:
 * - All field validation and password strength checks are done by changePasswordValidations middleware.
 * - The password hashing occurs automatically via the `pre("save")` hook in the User model.
 * - `authenticateToken` middleware is required to access this route.
 * - Returns null instead of user object for security reasons.
 */

const updateMyPassword = async (req, res, next) => {
	try {
		const { currentPassword, newPassword } = req.body;

		const user = await User.findById(req.user._id).select("+password");
		if (!user) {
			throw createError(404, "User not found");
		}

		const isMatch = await bcrypt.compare(currentPassword, user.password);
		if (!isMatch) {
			throw createError(401, "Current password is incorrect");
		}

		// Assign new password (will be hashed by pre-save hook)
		user.password = newPassword;
		await user.save();

		return sendResponse(res, 200, true, "Password changed successfully", null);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: deleteMyAccount
 * ---------------------------
 * Permanently deletes the authenticated user's account and all associated data.
 *
 * Workflow:
 * 1. Finds the user by `req.user._id`.
 * 2. Deletes the user's profile image from Cloudinary (if exists).
 * 3. Cascade deletes all journal entries:
 *    - Extracts and deletes all photos from Cloudinary
 *    - Extracts and deletes all voice notes from Cloudinary
 *    - Deletes journal entry documents
 * 4. Cascade deletes all sessions associated with the user.
 * 5. Deletes the user record from the database.
 * 6. Returns a 200 response confirming permanent deletion.
 *
 * Error Handling:
 * - Throws 404 if the user does not exist.
 * - Any other errors are passed to the global error handler via `next(error)`.
 *
 * Notes:
 * - Requires `authenticateToken` middleware (user must be logged in).
 * - This is a permanent operation — all user data is irrevocably deleted.
 * - Cascade deletes related data (sessions, journal entries, media files).
 * - Consider implementing soft-deletion if audit logs are required.
 */

const deleteMyAccount = async (req, res, next) => {
	try {
		const Session = require("../models/Session.model");
		const JournalEntry = require("../models/JournalEntry.model");

		// Find the authenticated user
		const user = await User.findById(req.user._id);

		if (!user) {
			throw createError(404, "User not found");
		}

		// Delete profile picture from Cloudinary
		if (user.profileImageId) {
			await deleteImgCloudinary(user.profileImageId);
		}

		// Delete all journal entries with their media
		const journals = await JournalEntry.find({ user: req.user._id });
		for (const journal of journals) {
			// Delete photos
			for (const photo of journal.photos) {
				const urlParts = photo.url.split("/");
				const publicId = urlParts[urlParts.length - 1].split(".")[0];
				await deleteImgCloudinary(publicId);
			}
			// Delete voice notes
			for (const voiceNote of journal.voiceNotes) {
				const urlParts = voiceNote.url.split("/");
				const publicId = urlParts[urlParts.length - 1].split(".")[0];
				await deleteImgCloudinary(publicId);
			}
		}

		// Delete all journals
		await JournalEntry.deleteMany({ user: req.user._id });

		// Delete all sessions
		await Session.deleteMany({ user: req.user._id });

		// Delete user
		await User.findByIdAndDelete(req.user._id);

		return sendResponse(
			res,
			200,
			true,
			"Account deleted successfully. All your data has been permanently removed.",
			null,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getMyStats
 * ----------------------
 * Retrieves comprehensive practice statistics for the authenticated user.
 *
 * Workflow:
 * 1. Fetches user document (for totalSessions, totalMinutes, currentStreak, lastPracticeDate).
 * 2. Queries completed sessions from the last 4 weeks with populated sequence data.
 * 3. Calculates additional metrics:
 *    - Sessions per week (breaks down across 4 weeks)
 *    - Most practiced VK families (top 5, sorted by frequency)
 *    - Average session duration
 * 4. Extracts VK progression data (unlockedFamilies, completedSequencesCount, currentSequence).
 * 5. Returns comprehensive stats object for dashboard/analytics.
 *
 * Error Handling:
 * - 404: User not found
 *
 * Notes:
 * - Requires `authenticateToken` middleware.
 * - Combines cached data (user document) with calculated data (from sessions).
 * - Perfect for dashboard and profile stats pages.
 * - Analyzes last 4 weeks for trending metrics.
 */
const getMyStats = async (req, res, next) => {
	try {
		const Session = require("../models/Session.model");

		const user = await User.findById(req.user._id);
		if (!user) {
			throw createError(404, "User not found");
		}

		// Get sessions in last 4 weeks
		const fourWeeksAgo = new Date();
		fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

		const recentSessions = await Session.find({
			user: req.user._id,
			completed: true,
			date: { $gte: fourWeeksAgo },
		}).populate("vkSequence");

		// Count sessions per week
		const sessionsPerWeek = [0, 0, 0, 0];
		const now = new Date();

		recentSessions.forEach((session) => {
			const daysDiff = Math.floor((now - session.date) / (1000 * 60 * 60 * 24));
			const weekIndex = Math.floor(daysDiff / 7);
			if (weekIndex < 4) {
				sessionsPerWeek[3 - weekIndex]++;
			}
		});

		// Most practiced families
		const familyCounts = {};
		recentSessions.forEach((session) => {
			if (session.vkSequence?.family) {
				familyCounts[session.vkSequence.family] =
					(familyCounts[session.vkSequence.family] || 0) + 1;
			}
		});

		const mostPracticedFamilies = Object.entries(familyCounts)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
			.map(([family, count]) => ({ family, count }));

		// Calculate average duration
		const totalMinutes = recentSessions.reduce((sum, s) => sum + s.duration, 0);
		const avgDuration =
			recentSessions.length > 0 ? Math.round(totalMinutes / recentSessions.length) : 0;

		return sendResponse(res, 200, true, "Stats retrieved successfully", {
			totalSessions: user.totalSessions,
			totalMinutes: user.totalMinutes,
			currentStreak: user.currentStreak,
			lastPracticeDate: user.lastPracticeDate,
			sessionsPerWeek,
			mostPracticedFamilies,
			avgDuration,
			vkProgression: {
				unlockedFamilies: user.vkProgression.unlockedFamilies,
				completedSequencesCount: user.vkProgression.completedSequences.length,
				currentSequence: user.vkProgression.currentMainSequence,
			},
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getMyProfile,
	updateMyProfile,
	updateMyPassword,
	deleteMyAccount,
	getMyStats,
};
