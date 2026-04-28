const mongoose = require("mongoose");
const User = require("../models/User.model");
const Session = require("../models/Session.model");
const JournalEntry = require("../models/JournalEntry.model");
const bcrypt = require("bcrypt");
const { deleteImgCloudinary } = require("../../utils/deleteImage");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

/**
 * Strips internal fields from a user object before sending as a response.
 */
function sanitizeUser(user) {
	const obj = user.toObject ? user.toObject() : { ...user };
	delete obj.password;
	delete obj.vkProgression;
	return obj;
}

/**
 * Controller: getMyProfile
 * ------------------------
 * Retrieves the authenticated user's profile.
 */
const getMyProfile = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id).select("-password");

		if (!user) {
			throw createError(404, "User not found");
		}

		return sendResponse(res, 200, true, "Profile retrieved successfully", sanitizeUser(user));
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: updateMyProfile
 * ---------------------------
 * Allows the authenticated user to update their own profile information and preferences.
 */
const updateMyProfile = async (req, res, next) => {
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

		// Update allowed fields — use !== undefined to allow empty strings / falsy values
		if (req.body.name !== undefined) {
			user.name = req.body.name.trim();
		}

		if (req.body.email !== undefined) {
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
		if (req.body.goals !== undefined) {
			user.goals = req.body.goals;
		}

		// Update preferences (object)
		if (req.body.preferences) {
			const preferences = req.body.preferences;

			if (preferences.practiceIntensity !== undefined) {
				user.set("preferences.practiceIntensity", preferences.practiceIntensity);
			}

			if (preferences.sessionDuration !== undefined) {
				user.set("preferences.sessionDuration", preferences.sessionDuration);
			}

			if (preferences.timeOfDay !== undefined) {
				user.set("preferences.timeOfDay", preferences.timeOfDay);
			}

			if (preferences.notifications !== undefined) {
				user.set("preferences.notifications", preferences.notifications);
			}

			if (preferences.language !== undefined) {
				user.set("preferences.language", preferences.language);
			}

			if (preferences.theme !== undefined) {
				user.set("preferences.theme", preferences.theme);
			}

			if (preferences.lowStimMode !== undefined) {
				user.set("preferences.lowStimMode", preferences.lowStimMode);
			}

			if (preferences.safetyAnchors !== undefined) {
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

		const updatedUser = await user.save();

		return sendResponse(res, 200, true, "Profile updated successfully", sanitizeUser(updatedUser));
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: updateMyPassword
 * ----------------------------
 * Allows the authenticated user to securely change their password.
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
 * Performs the database deletions for account removal, optionally within
 * a MongoDB session (transaction).
 */
async function performAccountDeletion(userId, opts = {}) {
	await JournalEntry.deleteMany({ user: userId }, opts);
	await Session.deleteMany({ user: userId }, opts);
	await User.findByIdAndDelete(userId, opts);
}

/**
 * Controller: deleteMyAccount
 * ---------------------------
 * Permanently deletes the authenticated user's account and all associated data.
 * Uses a MongoDB transaction when the deployment supports replica sets, and
 * falls back to sequential deletes otherwise.
 */
const deleteMyAccount = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id);

		if (!user) {
			throw createError(404, "User not found");
		}

		// Collect all Cloudinary IDs for batch deletion
		const cloudinaryIds = [];

		if (user.profileImageId) {
			cloudinaryIds.push(user.profileImageId);
		}

		const journals = await JournalEntry.find({ user: req.user._id });
		for (const journal of journals) {
			for (const photo of journal.photos) {
				if (photo.cloudinaryId) cloudinaryIds.push(photo.cloudinaryId);
			}
			for (const voiceNote of journal.voiceNotes) {
				if (voiceNote.cloudinaryId) cloudinaryIds.push(voiceNote.cloudinaryId);
			}
		}

		// Attempt transactional delete; fall back to sequential if not supported
		let usedTransaction = false;
		try {
			const session = await mongoose.startSession();
			session.startTransaction();
			await performAccountDeletion(req.user._id, { session });
			await session.commitTransaction();
			session.endSession();
			usedTransaction = true;
		} catch {
			// Transaction not supported (e.g. standalone MongoDB) — delete sequentially
		}

		if (!usedTransaction) {
			await performAccountDeletion(req.user._id);
		}

		// Delete Cloudinary assets in parallel AFTER the DB deletes succeed
		if (cloudinaryIds.length > 0) {
			await Promise.allSettled(cloudinaryIds.map((id) => deleteImgCloudinary(id)));
		}

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
			bestStreak: user.bestStreak,
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

		return sendResponse(
			res,
			200,
			true,
			"Profile image updated successfully",
			sanitizeUser(updatedUser),
		);
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

		return sendResponse(
			res,
			200,
			true,
			"Profile image deleted successfully",
			sanitizeUser(updatedUser),
		);
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
