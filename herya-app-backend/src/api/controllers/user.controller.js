const User = require("../models/User.model");
const Session = require("../models/Session.model");
const JournalEntry = require("../models/JournalEntry.model");
const bcrypt = require("bcrypt");
const { deleteImgCloudinary } = require("../../utils/deleteImage");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

/**
 * Controller: getMyProfile
 * ------------------------
 * Retrieves the authenticated user's profile.
 *
 * Workflow:
 * 1. Uses `req.user._id` (set by authenticateToken middleware) to find the current user in the database.
 * 2. Excludes the password field using `.select("-password")`.
 * 3. Returns a 200 response with the user's profile data.
 *
 * Error Handling:
 * - Throws 404 if the user cannot be found.
 * - Any other errors are forwarded to the global error handler.
 *
 * Notes:
 * - Requires `authenticateToken` middleware to ensure `req.user` is available.
 * - Keeps practice-history fields internal to the account record.
 * - Ideal for displaying personal information on a “My Profile” page.
 */

const getMyProfile = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id).select("-password");

		if (!user) {
			throw createError(404, "User not found");
		}

		const userResponse = user.toObject();
		delete userResponse.vkProgression;

		return sendResponse(res, 200, true, "Profile retrieved successfully", userResponse);
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
 *    - Cannot change practice-history metadata directly (throws 403).
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
				"Practice history is managed by the system and cannot be changed manually",
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

		if (req.body.pronouns !== undefined) {
			user.pronouns = String(req.body.pronouns).trim();
		}

		// Update goals (array of strings)
		if (req.body.goals) {
			user.goals = req.body.goals;
		}

		// Update preferences (object)
		if (req.body.preferences) {
			const preferences = req.body.preferences;

			if (preferences.practiceIntensity) {
				user.set("preferences.practiceIntensity", preferences.practiceIntensity);
			}

			if (preferences.sessionDuration !== undefined) {
				user.set("preferences.sessionDuration", preferences.sessionDuration);
			}

			if (preferences.timeOfDay) {
				user.set("preferences.timeOfDay", preferences.timeOfDay);
			}

			if (preferences.notifications) {
				user.set("preferences.notifications", preferences.notifications);
			}

			if (preferences.language) {
				user.set("preferences.language", preferences.language);
			}

			if (preferences.theme) {
				user.set("preferences.theme", preferences.theme);
			}

			if (preferences.lowStimMode !== undefined) {
				user.set("preferences.lowStimMode", preferences.lowStimMode);
			}

			if (preferences.safetyAnchors) {
				const phrase =
					typeof preferences.safetyAnchors.phrase === "string"
						? preferences.safetyAnchors.phrase.trim()
						: user.preferences?.safetyAnchors?.phrase || "";
				const bodyCue =
					typeof preferences.safetyAnchors.bodyCue === "string"
						? preferences.safetyAnchors.bodyCue.trim()
						: user.preferences?.safetyAnchors?.bodyCue || "";

				user.set("preferences.safetyAnchors", {
					phrase,
					bodyCue,
				});
			}
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
				if (photo.cloudinaryId) {
					await deleteImgCloudinary(photo.cloudinaryId);
				}
			}
			// Delete voice notes
			for (const voiceNote of journal.voiceNotes) {
				if (voiceNote.cloudinaryId) {
					await deleteImgCloudinary(voiceNote.cloudinaryId);
				}
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
 * 4. Extracts practice history metrics for dashboard use.
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
			completedSequencesCount: user.vkProgression.completedSequences.length,
		});
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: updateMyProfileImage
 * --------------------------------
 * Updates only the authenticated user's profile image.
 *
 * Workflow:
 * 1. Requires an image file via multipart/form-data.
 * 2. Finds the user by `req.user._id`.
 * 3. Stores old image ID for cleanup.
 * 4. Updates profileImageUrl and profileImageId with new image data.
 * 5. Saves the user to the database.
 * 6. Deletes the old image from Cloudinary after successful save.
 * 7. Returns the updated user object without password.
 *
 * Error Handling:
 * - 400 if no image file is provided.
 * - 404 if the user is not found.
 * - Cleans up new image from Cloudinary if database save fails.
 */
const updateMyProfileImage = async (req, res, next) => {
	let imageUploaded = false;
	let oldImageId = null;

	try {
		if (!req.file) {
			throw createError(400, "No image file provided");
		}

		const user = await User.findById(req.user._id);
		if (!user) {
			throw createError(404, "User not found");
		}

		// Store old image ID for cleanup
		oldImageId = user.profileImageId;

		// Update profile image
		user.profileImageUrl = req.file.path;
		user.profileImageId = req.file.filename;
		imageUploaded = true;

		const updatedUser = await user.save();

		// Delete old image only after successful save
		if (oldImageId) {
			await deleteImgCloudinary(oldImageId);
		}

		// Remove password from response
		const userResponse = updatedUser.toObject();
		delete userResponse.password;

		return sendResponse(res, 200, true, "Profile image updated successfully", userResponse);
	} catch (error) {
		// Clean up new image if save failed
		if (imageUploaded && req.file?.filename) {
			await deleteImgCloudinary(req.file.filename);
		}
		return next(error);
	}
};

/**
 * Controller: deleteMyProfileImage
 * --------------------------------
 * Deletes the authenticated user's profile image.
 *
 * Workflow:
 * 1. Finds the user by `req.user._id`.
 * 2. If user has a profile image:
 *    - Deletes the image from Cloudinary
 *    - Clears profileImageUrl and profileImageId from user record
 *    - Saves the updated user to the database
 * 3. Returns the updated user object without password.
 *
 * Error Handling:
 * - 404 if the user is not found.
 * - 400 if the user has no image to delete.
 */
const deleteMyProfileImage = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			throw createError(404, "User not found");
		}

		if (!user.profileImageId) {
			throw createError(400, "User has no profile image to delete");
		}

		// Delete image from Cloudinary
		const oldImageId = user.profileImageId;
		await deleteImgCloudinary(oldImageId);

		// Clear image from user document
		user.profileImageUrl = null;
		user.profileImageId = null;
		const updatedUser = await user.save();

		// Remove password from response
		const userResponse = updatedUser.toObject();
		delete userResponse.password;

		return sendResponse(res, 200, true, "Profile image deleted successfully", userResponse);
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
	updateMyProfileImage,
	deleteMyProfileImage,
};
