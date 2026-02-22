const User = require("../models/User.model");
const VKSequence = require("../models/VinyasaKramaSequence.model");
const Pose = require("../models/Pose.model");
const BreathingPattern = require("../models/BreathingPattern.model");
const Session = require("../models/Session.model");
const JournalEntry = require("../models/JournalEntry.model");
const { sendResponse } = require("../../utils/sendResponse");
const { deleteImgCloudinary } = require("../../utils/deleteImage");
const createError = require("../../utils/createError");

// ==================== USER MANAGEMENT ====================

/**
 * Controller: getAllUsers (Admin)
 * --------------------------------
 * Retrieves all users with pagination and filtering.
 *
 * Query Parameters:
 * - role: Filter by role (user/admin)
 * - page: Page number
 * - limit: Results per page
 * - search: Search by name or email
 *
 * Notes:
 * - Excludes password field.
 * - Admin only endpoint.
 */
const getAllUsers = async (req, res, next) => {
	try {
		const { role, page = 1, limit = 20, search } = req.query;

		const filter = {};
		if (role) filter.role = role;

		if (search) {
			filter.$or = [{ name: new RegExp(search, "i") }, { email: new RegExp(search, "i") }];
		}

		const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

		const users = await User.find(filter)
			.select("-password")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit, 10));

		const total = await User.countDocuments(filter);

		return sendResponse(res, 200, true, "Users retrieved successfully", {
			users,
			pagination: {
				page: parseInt(page, 10),
				limit: parseInt(limit, 10),
				total,
				pages: Math.ceil(total / parseInt(limit, 10)),
			},
		});
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: updateUserRole (Admin)
 * -----------------------------------
 * Updates a user's role (user ↔ admin).
 */
const updateUserRole = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { role } = req.body;

		if (!["user", "admin"].includes(role)) {
			throw createError(400, "Invalid role. Must be 'user' or 'admin'");
		}

		const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");

		if (!user) {
			throw createError(404, "User not found");
		}

		return sendResponse(res, 200, true, "User role updated successfully", user);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: deleteUser (Admin)
 * -------------------------------
 * Deletes a user and all associated data.
 *
 * Cascade deletes:
 * - All sessions
 * - All journal entries (with photos/voice notes)
 * - Profile image
 */
const deleteUser = async (req, res, next) => {
	try {
		const { id } = req.params;

		const user = await User.findById(id);
		if (!user) {
			throw createError(404, "User not found");
		}

		// Delete profile image
		if (user.profileImageId) {
			await deleteImgCloudinary(user.profileImageId);
		}

		// Delete all journal entries with media
		const journals = await JournalEntry.find({ user: id });
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
		await JournalEntry.deleteMany({ user: id });

		// Delete all sessions
		await Session.deleteMany({ user: id });

		// Delete user
		await User.findByIdAndDelete(id);

		return sendResponse(res, 200, true, "User deleted successfully", null);
	} catch (error) {
		return next(error);
	}
};

// ==================== VK SEQUENCE MANAGEMENT ====================

/**
 * Controller: createVKSequence (Admin)
 * -------------------------------------
 * Creates a new VK sequence (system template).
 */
const createVKSequence = async (req, res, next) => {
	try {
		const sequence = new VKSequence({
			...req.body,
			isSystemSequence: true,
		});

		const savedSequence = await sequence.save();

		await savedSequence.populate("structure.corePoses.pose");
		await savedSequence.populate("prerequisites");
		await savedSequence.populate("recommendedPranayama.pattern");

		return sendResponse(res, 201, true, "VK Sequence created successfully", savedSequence);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: updateVKSequence (Admin)
 * -------------------------------------
 * Updates an existing VK sequence.
 */
const updateVKSequence = async (req, res, next) => {
	try {
		const { id } = req.params;

		const sequence = await VKSequence.findByIdAndUpdate(id, req.body, {
			new: true,
			runValidators: true,
		})
			.populate("structure.corePoses.pose")
			.populate("prerequisites")
			.populate("recommendedPranayama.pattern");

		if (!sequence) {
			throw createError(404, "VK Sequence not found");
		}

		return sendResponse(res, 200, true, "VK Sequence updated successfully", sequence);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: deleteVKSequence (Admin)
 * -------------------------------------
 * Deletes a VK sequence.
 *
 * Notes:
 * - Cannot delete if sequence is referenced in sessions.
 * - Or implement soft delete with isActive flag.
 */
const deleteVKSequence = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Check if sequence is used in any sessions
		const sessionCount = await Session.countDocuments({ vkSequence: id });

		if (sessionCount > 0) {
			throw createError(400, `Cannot delete: Sequence is used in ${sessionCount} sessions`);
		}

		const sequence = await VKSequence.findByIdAndDelete(id);

		if (!sequence) {
			throw createError(404, "VK Sequence not found");
		}

		return sendResponse(res, 200, true, "VK Sequence deleted successfully", null);
	} catch (error) {
		return next(error);
	}
};

// ==================== POSE MANAGEMENT ====================

/**
 * Controller: createPose (Admin)
 * -------------------------------
 * Creates a new pose (system pose).
 */
const createPose = async (req, res, next) => {
	const uploadedImages = [];

	try {
		const pose = new Pose({
			...req.body,
			isSystemPose: true,
		});

		// Handle media uploads
		if (req.files) {
			if (req.files.thumbnail) {
				pose.media.thumbnail = req.files.thumbnail[0].path;
				uploadedImages.push(req.files.thumbnail[0].filename);
			}

			if (req.files.images) {
				pose.media.images = req.files.images.map((file) => file.path);
				uploadedImages.push(...req.files.images.map((f) => f.filename));
			}

			if (req.files.videos) {
				pose.media.videos = req.files.videos.map((file) => file.path);
			}
		}

		const savedPose = await pose.save();

		await savedPose.populate("preparatoryPoses");
		await savedPose.populate("followUpPoses");

		return sendResponse(res, 201, true, "Pose created successfully", savedPose);
	} catch (error) {
		// Clean up uploaded images on error
		for (const imageId of uploadedImages) {
			await deleteImgCloudinary(imageId);
		}
		return next(error);
	}
};

/**
 * Controller: updatePose (Admin)
 * -------------------------------
 * Updates an existing pose.
 */
const updatePose = async (req, res, next) => {
	const uploadedImages = [];
	const oldImageIds = [];

	try {
		const { id } = req.params;

		const pose = await Pose.findById(id);
		if (!pose) {
			throw createError(404, "Pose not found");
		}

		// Store old image IDs for cleanup
		if (pose.media.thumbnail) {
			const urlParts = pose.media.thumbnail.split("/");
			oldImageIds.push(urlParts[urlParts.length - 1].split(".")[0]);
		}

		// Update fields
		Object.keys(req.body).forEach((key) => {
			if (req.body[key] !== undefined && key !== "_id") {
				pose[key] = req.body[key];
			}
		});

		// Handle new media uploads
		if (req.files) {
			if (req.files.thumbnail) {
				pose.media.thumbnail = req.files.thumbnail[0].path;
				uploadedImages.push(req.files.thumbnail[0].filename);
			}

			if (req.files.images) {
				const newImages = req.files.images.map((file) => file.path);
				pose.media.images = [...pose.media.images, ...newImages];
				uploadedImages.push(...req.files.images.map((f) => f.filename));
			}
		}

		const updatedPose = await pose.save();

		// Delete old images only after successful save
		for (const imageId of oldImageIds) {
			await deleteImgCloudinary(imageId);
		}

		await updatedPose.populate("preparatoryPoses");
		await updatedPose.populate("followUpPoses");

		return sendResponse(res, 200, true, "Pose updated successfully", updatedPose);
	} catch (error) {
		// Clean up newly uploaded images on error
		for (const imageId of uploadedImages) {
			await deleteImgCloudinary(imageId);
		}
		return next(error);
	}
};

/**
 * Controller: deletePose (Admin)
 * -------------------------------
 * Deletes a pose.
 *
 * Notes:
 * - Cannot delete if pose is referenced in sequences.
 * - Deletes associated media from Cloudinary.
 */
const deletePose = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Check if pose is used in any sequences
		const sequenceCount = await VKSequence.countDocuments({
			"structure.corePoses.pose": id,
		});

		if (sequenceCount > 0) {
			throw createError(400, `Cannot delete: Pose is used in ${sequenceCount} sequences`);
		}

		const pose = await Pose.findById(id);
		if (!pose) {
			throw createError(404, "Pose not found");
		}

		// Delete media from Cloudinary
		if (pose.media.thumbnail) {
			const urlParts = pose.media.thumbnail.split("/");
			const publicId = urlParts[urlParts.length - 1].split(".")[0];
			await deleteImgCloudinary(publicId);
		}

		for (const imageUrl of pose.media.images) {
			const urlParts = imageUrl.split("/");
			const publicId = urlParts[urlParts.length - 1].split(".")[0];
			await deleteImgCloudinary(publicId);
		}

		await Pose.findByIdAndDelete(id);

		return sendResponse(res, 200, true, "Pose deleted successfully", null);
	} catch (error) {
		return next(error);
	}
};

// ==================== BREATHING PATTERN MANAGEMENT ====================

/**
 * Controller: createBreathingPattern (Admin)
 * -------------------------------------------
 * Creates a new breathing pattern (system pattern).
 */
const createBreathingPattern = async (req, res, next) => {
	try {
		const pattern = new BreathingPattern({
			...req.body,
			isSystemPattern: true,
		});

		const savedPattern = await pattern.save();

		await savedPattern.populate("vkContext.prerequisiteBreathing");

		return sendResponse(res, 201, true, "Breathing pattern created successfully", savedPattern);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: updateBreathingPattern (Admin)
 * -------------------------------------------
 * Updates an existing breathing pattern.
 */
const updateBreathingPattern = async (req, res, next) => {
	try {
		const { id } = req.params;

		const pattern = await BreathingPattern.findByIdAndUpdate(id, req.body, {
			new: true,
			runValidators: true,
		}).populate("vkContext.prerequisiteBreathing");

		if (!pattern) {
			throw createError(404, "Breathing pattern not found");
		}

		return sendResponse(res, 200, true, "Breathing pattern updated successfully", pattern);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: deleteBreathingPattern (Admin)
 * -------------------------------------------
 * Deletes a breathing pattern.
 */
const deleteBreathingPattern = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Check if pattern is used in any sessions
		const sessionCount = await Session.countDocuments({
			"completePractice.pranayama": id,
		});

		if (sessionCount > 0) {
			throw createError(400, `Cannot delete: Pattern is used in ${sessionCount} sessions`);
		}

		const pattern = await BreathingPattern.findByIdAndDelete(id);

		if (!pattern) {
			throw createError(404, "Breathing pattern not found");
		}

		return sendResponse(res, 200, true, "Breathing pattern deleted successfully", null);
	} catch (error) {
		return next(error);
	}
};

// ==================== ANALYTICS & STATS ====================

/**
 * Controller: getDashboardStats (Admin)
 * --------------------------------------
 * Retrieves overall platform statistics.
 *
 * Returns:
 * - Total users
 * - New users this month
 * - Total sessions
 * - Total journal entries
 * - Most popular VK families
 * - Active users (last 30 days)
 * - Average session duration
 */
const getDashboardStats = async (_, res, next) => {
	try {
		// Total counts
		const totalUsers = await User.countDocuments();
		const totalSessions = await Session.countDocuments();
		const totalJournals = await JournalEntry.countDocuments();
		const totalPoses = await Pose.countDocuments({ isSystemPose: true });
		const totalSequences = await VKSequence.countDocuments({
			isSystemSequence: true,
		});
		const totalBreathingPatterns = await BreathingPattern.countDocuments({
			isSystemPattern: true,
		});

		// New users this month
		const thisMonth = new Date();
		thisMonth.setDate(1);
		thisMonth.setHours(0, 0, 0, 0);

		const newUsersThisMonth = await User.countDocuments({
			createdAt: { $gte: thisMonth },
		});

		// Active users (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const activeUsers = await User.countDocuments({
			lastPracticeDate: { $gte: thirtyDaysAgo },
		});

		// Most popular VK families
		const popularFamilies = await Session.aggregate([
			{
				$lookup: {
					from: "vksequences",
					localField: "vkSequence",
					foreignField: "_id",
					as: "sequenceData",
				},
			},
			{ $unwind: "$sequenceData" },
			{
				$group: {
					_id: "$sequenceData.family",
					count: { $sum: 1 },
				},
			},
			{ $sort: { count: -1 } },
			{ $limit: 5 },
		]);

		// Average session duration
		const sessionStats = await Session.aggregate([
			{ $match: { completed: true } },
			{
				$group: {
					_id: null,
					avgDuration: { $avg: "$duration" },
					totalMinutes: { $sum: "$duration" },
				},
			},
		]);

		// Sessions per day (last 7 days)
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

		const sessionsPerDay = await Session.aggregate([
			{
				$match: {
					date: { $gte: sevenDaysAgo },
					completed: true,
				},
			},
			{
				$group: {
					_id: {
						$dateToString: { format: "%Y-%m-%d", date: "$date" },
					},
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		return sendResponse(res, 200, true, "Dashboard stats retrieved", {
			users: {
				total: totalUsers,
				newThisMonth: newUsersThisMonth,
				active: activeUsers,
			},
			content: {
				totalSessions,
				totalJournals,
				totalPoses,
				totalSequences,
				totalBreathingPatterns,
			},
			sessions: {
				avgDuration: sessionStats[0]?.avgDuration || 0,
				totalMinutes: sessionStats[0]?.totalMinutes || 0,
				perDay: sessionsPerDay,
			},
			popularFamilies,
		});
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getUserAnalytics (Admin)
 * -------------------------------------
 * Gets detailed analytics for a specific user.
 */
const getUserAnalytics = async (req, res, next) => {
	try {
		const { userId } = req.params;

		const user = await User.findById(userId);
		if (!user) {
			throw createError(404, "User not found");
		}

		// Session breakdown
		const sessionsByType = await Session.aggregate([
			{ $match: { user: user._id, completed: true } },
			{
				$group: {
					_id: "$sessionType",
					count: { $sum: 1 },
					totalMinutes: { $sum: "$duration" },
				},
			},
		]);

		// Journal entry count
		const journalCount = await JournalEntry.countDocuments({ user: user._id });

		// VK progression
		const completedSequences = user.vkProgression.completedSequences.length;
		const unlockedFamilies = user.vkProgression.unlockedFamilies.length;

		// Recent activity
		const recentSessions = await Session.find({ user: user._id })
			.sort({ date: -1 })
			.limit(10)
			.populate("vkSequence");

		return sendResponse(res, 200, true, "User analytics retrieved", {
			user: {
				_id: user._id,
				name: user.name,
				email: user.email,
				totalSessions: user.totalSessions,
				totalMinutes: user.totalMinutes,
				currentStreak: user.currentStreak,
				lastPracticeDate: user.lastPracticeDate,
			},
			sessionsByType,
			journalCount,
			vkProgression: {
				completedSequences,
				unlockedFamilies,
				currentLevel: user.vkProgression.currentMainSequence,
			},
			recentSessions,
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	// User Management
	getAllUsers,
	updateUserRole,
	deleteUser,

	// VK Sequence Management
	createVKSequence,
	updateVKSequence,
	deleteVKSequence,

	// Pose Management
	createPose,
	updatePose,
	deletePose,

	// Breathing Pattern Management
	createBreathingPattern,
	updateBreathingPattern,
	deleteBreathingPattern,

	// Analytics
	getDashboardStats,
	getUserAnalytics,
};
