const User = require("../models/User.model");
const VKSequence = require("../models/VinyasaKramaSequence.model");
const Pose = require("../models/Pose.model");
const BreathingPattern = require("../models/BreathingPattern.model");
const Session = require("../models/Session.model");
const JournalEntry = require("../models/JournalEntry.model");
const { sendResponse } = require("../../utils/sendResponse");
const { deleteImgCloudinary } = require("../../utils/deleteImage");
const { createError } = require("../../utils/createError");

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
			filter.$or = [
				{ name: new RegExp(search, "i") },
				{ email: new RegExp(search, "i") },
			];
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
 * Changes a user's role between 'user' and 'admin'.
 *
 * URL Parameters:
 * - id: MongoDB ObjectId of the target user
 *
 * Request Body:
 * - role: "user" | "admin"
 *
 * Workflow:
 * 1. Validates role value against allowed list.
 * 2. Updates user's role field with findByIdAndUpdate.
 * 3. Returns updated user (password excluded).
 *
 * Response:
 * - Updated user object (no password)
 *
 * Error Handling:
 * - 400: Invalid role value
 * - 404: User not found
 *
 * Notes:
 * - Admin only endpoint.
 */
const updateUserRole = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { role } = req.body;

		if (!["user", "admin"].includes(role)) {
			throw createError(400, "Invalid role. Must be 'user' or 'admin'");
		}

		const user = await User.findByIdAndUpdate(
			id,
			{ role },
			{ returnDocument: "after" },
		).select("-password");

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
 * Permanently deletes a user and all associated data.
 *
 * URL Parameters:
 * - id: MongoDB ObjectId of the target user
 *
 * Workflow:
 * 1. Finds user by ID.
 * 2. Deletes profile image from Cloudinary (if exists).
 * 3. Cascade deletes all journal entries with their Cloudinary media (photos + voice notes).
 * 4. Cascade deletes all sessions.
 * 5. Deletes the user document.
 *
 * Response:
 * - null (deletion confirmed)
 *
 * Error Handling:
 * - 404: User not found
 *
 * Notes:
 * - Admin only endpoint.
 * - Permanent — no soft delete.
 * - Uses cloudinaryId field for safe media deletion.
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

/**
 * Controller: createVKSequence (Admin)
 * -------------------------------------
 * Creates a new VK sequence and marks it as a system template.
 *
 * Request Body:
 * - All VinyasaKramaSequence schema fields (family, level, sanskritName, englishName, structure, etc.)
 *
 * Workflow:
 * 1. Creates VKSequence document from request body with isSystemSequence: true.
 * 2. Mongoose pre-save hooks validate corePoses order and estimatedDuration consistency.
 * 3. Populates corePoses, prerequisites, and pranayama references.
 * 4. Returns created sequence.
 *
 * Response:
 * - Newly created sequence with populated references
 *
 * Error Handling:
 * - 400: Mongoose validation error (missing required fields, invalid enums, invalid corePoses order)
 *
 * Notes:
 * - Admin only endpoint.
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

		return sendResponse(
			res,
			201,
			true,
			"VK Sequence created successfully",
			savedSequence,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: updateVKSequence (Admin)
 * -------------------------------------
 * Updates fields on an existing VK sequence.
 *
 * URL Parameters:
 * - id: MongoDB ObjectId of the sequence
 *
 * Request Body:
 * - Any VinyasaKramaSequence fields to update
 *
 * Workflow:
 * 1. Finds sequence by ID and applies updates atomically with findByIdAndUpdate.
 * 2. Runs Mongoose validators on update (runValidators: true).
 * 3. Populates references and returns updated sequence.
 *
 * Response:
 * - Updated sequence with populated references
 *
 * Error Handling:
 * - 400: Validation error
 * - 404: Sequence not found
 *
 * Notes:
 * - Admin only endpoint.
 */
const updateVKSequence = async (req, res, next) => {
	try {
		const { id } = req.params;

		const sequence = await VKSequence.findByIdAndUpdate(id, req.body, {
			returnDocument: "after",
			runValidators: true,
		})
			.populate("structure.corePoses.pose")
			.populate("prerequisites")
			.populate("recommendedPranayama.pattern");

		if (!sequence) {
			throw createError(404, "VK Sequence not found");
		}

		return sendResponse(
			res,
			200,
			true,
			"VK Sequence updated successfully",
			sequence,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: deleteVKSequence (Admin)
 * -------------------------------------
 * Deletes a VK sequence after verifying it is not in use.
 *
 * URL Parameters:
 * - id: MongoDB ObjectId of the sequence
 *
 * Workflow:
 * 1. Counts sessions that reference this sequence.
 * 2. Throws 400 if sequence is in use.
 * 3. Deletes sequence document.
 *
 * Response:
 * - null (deletion confirmed)
 *
 * Error Handling:
 * - 400: Sequence referenced in one or more sessions
 * - 404: Sequence not found
 *
 * Notes:
 * - Admin only endpoint.
 * - Does not cascade delete user vkProgression references.
 */
const deleteVKSequence = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Check if sequence is used in any sessions
		const sessionCount = await Session.countDocuments({ vkSequence: id });

		if (sessionCount > 0) {
			throw createError(
				400,
				`Cannot delete: Sequence is used in ${sessionCount} sessions`,
			);
		}

		const sequence = await VKSequence.findByIdAndDelete(id);

		if (!sequence) {
			throw createError(404, "VK Sequence not found");
		}

		return sendResponse(
			res,
			200,
			true,
			"VK Sequence deleted successfully",
			null,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: createPose (Admin)
 * -------------------------------
 * Creates a new pose and marks it as a system pose.
 *
 * Request Body:
 * - All Pose schema fields (name, category, difficulty, vkContext, etc.)
 *
 * Request Files (multipart):
 * - thumbnail: Single image file (optional)
 * - images: Multiple image files (optional)
 * - videos: Multiple video files (optional)
 *
 * Workflow:
 * 1. Creates Pose document with isSystemPose: true.
 * 2. Uploads thumbnail and images to Cloudinary if provided.
 * 3. Saves pose and populates preparatoryPoses and followUpPoses.
 * 4. On error, cleans up uploaded files from Cloudinary.
 *
 * Response:
 * - Newly created pose with populated relationships
 *
 * Error Handling:
 * - 400: Mongoose validation error
 * - Uploaded images deleted on any save failure
 *
 * Notes:
 * - Admin only endpoint.
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
				pose.media.thumbnail = {
					url: req.files.thumbnail[0].path,
					cloudinaryId: req.files.thumbnail[0].filename,
				};
				uploadedImages.push(req.files.thumbnail[0].filename);
			}

			if (req.files.images) {
				pose.media.images = req.files.images.map((file) => ({
					url: file.path,
					cloudinaryId: file.filename,
				}));
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
 * Updates an existing pose's fields and/or media.
 *
 * URL Parameters:
 * - id: MongoDB ObjectId of the pose
 *
 * Request Body:
 * - Any Pose schema fields to update
 *
 * Request Files (multipart):
 * - thumbnail: Replaces existing thumbnail
 * - images: Appended to existing image array
 *
 * Workflow:
 * 1. Finds pose by ID.
 * 2. Stores old thumbnail publicId (parsed from URL) for deferred cleanup.
 * 3. Updates body fields on the document.
 * 4. Replaces thumbnail / appends images if new files provided.
 * 5. Saves pose and deletes old thumbnail from Cloudinary.
 *
 * Response:
 * - Updated pose with populated relationships
 *
 * Error Handling:
 * - 400: Validation error
 * - 404: Pose not found
 * - New uploads cleaned up on save error
 *
 * Notes:
 * - Admin only endpoint.
 * - Pose media stores { url, cloudinaryId } objects for safe Cloudinary deletion.
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

		// Store old thumbnail cloudinaryId for cleanup after successful save
		if (pose.media.thumbnail?.cloudinaryId) {
			oldImageIds.push(pose.media.thumbnail.cloudinaryId);
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
				pose.media.thumbnail = {
					url: req.files.thumbnail[0].path,
					cloudinaryId: req.files.thumbnail[0].filename,
				};
				uploadedImages.push(req.files.thumbnail[0].filename);
			}

			if (req.files.images) {
				const newImages = req.files.images.map((file) => ({
					url: file.path,
					cloudinaryId: file.filename,
				}));
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

		return sendResponse(
			res,
			200,
			true,
			"Pose updated successfully",
			updatedPose,
		);
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
 * Deletes a pose after verifying it is not referenced in any sequence.
 *
 * URL Parameters:
 * - id: MongoDB ObjectId of the pose
 *
 * Workflow:
 * 1. Counts VK sequences that reference this pose in corePoses.
 * 2. Throws 400 if pose is in use.
 * 3. Finds the pose to read media URLs.
 * 4. Deletes thumbnail and images from Cloudinary.
 * 5. Deletes pose document.
 *
 * Response:
 * - null (deletion confirmed)
 *
 * Error Handling:
 * - 400: Pose referenced in one or more sequences
 * - 404: Pose not found
 *
 * Notes:
 * - Admin only endpoint.
 * - Pose media stores { url, cloudinaryId } objects for safe Cloudinary deletion.
 */
const deletePose = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Check if pose is used in any sequences
		const sequenceCount = await VKSequence.countDocuments({
			"structure.corePoses.pose": id,
		});

		if (sequenceCount > 0) {
			throw createError(
				400,
				`Cannot delete: Pose is used in ${sequenceCount} sequences`,
			);
		}

		const pose = await Pose.findById(id);
		if (!pose) {
			throw createError(404, "Pose not found");
		}

		// Delete media from Cloudinary using stored cloudinaryId
		if (pose.media.thumbnail?.cloudinaryId) {
			await deleteImgCloudinary(pose.media.thumbnail.cloudinaryId);
		}

		for (const image of pose.media.images) {
			if (image.cloudinaryId) {
				await deleteImgCloudinary(image.cloudinaryId);
			}
		}

		await Pose.findByIdAndDelete(id);

		return sendResponse(res, 200, true, "Pose deleted successfully", null);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: createBreathingPattern (Admin)
 * -------------------------------------------
 * Creates a new breathing pattern and marks it as a system pattern.
 *
 * Request Body:
 * - All BreathingPattern schema fields (romanizationName, patternType, patternRatio, etc.)
 *
 * Workflow:
 * 1. Creates BreathingPattern document with isSystemPattern: true.
 * 2. Mongoose pre-validate hooks verify ratio consistency and min/max/default ranges.
 * 3. Populates prerequisiteBreathing references.
 * 4. Returns created pattern.
 *
 * Response:
 * - Newly created pattern with populated prerequisites
 *
 * Error Handling:
 * - 400: Mongoose validation error (invalid ratio, inconsistent practice ranges)
 *
 * Notes:
 * - Admin only endpoint.
 */
const createBreathingPattern = async (req, res, next) => {
	try {
		const pattern = new BreathingPattern({
			...req.body,
			isSystemPattern: true,
		});

		const savedPattern = await pattern.save();

		await savedPattern.populate("vkContext.prerequisiteBreathing");

		return sendResponse(
			res,
			201,
			true,
			"Breathing pattern created successfully",
			savedPattern,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: updateBreathingPattern (Admin)
 * -------------------------------------------
 * Updates fields on an existing breathing pattern.
 *
 * URL Parameters:
 * - id: MongoDB ObjectId of the pattern
 *
 * Request Body:
 * - Any BreathingPattern fields to update
 *
 * Workflow:
 * 1. Finds pattern by ID and applies updates with findByIdAndUpdate.
 * 2. Runs Mongoose validators (runValidators: true).
 * 3. Populates prerequisiteBreathing and returns updated pattern.
 *
 * Response:
 * - Updated pattern with populated references
 *
 * Error Handling:
 * - 400: Validation error
 * - 404: Pattern not found
 *
 * Notes:
 * - Admin only endpoint.
 */
const updateBreathingPattern = async (req, res, next) => {
	try {
		const { id } = req.params;

		const pattern = await BreathingPattern.findByIdAndUpdate(id, req.body, {
			returnDocument: "after",
			runValidators: true,
		}).populate("vkContext.prerequisiteBreathing");

		if (!pattern) {
			throw createError(404, "Breathing pattern not found");
		}

		return sendResponse(
			res,
			200,
			true,
			"Breathing pattern updated successfully",
			pattern,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: deleteBreathingPattern (Admin)
 * -------------------------------------------
 * Deletes a breathing pattern after verifying it is not in use.
 *
 * URL Parameters:
 * - id: MongoDB ObjectId of the pattern
 *
 * Workflow:
 * 1. Counts sessions that reference this pattern in completePractice.pranayama.
 * 2. Throws 400 if pattern is in use.
 * 3. Deletes pattern document.
 *
 * Response:
 * - null (deletion confirmed)
 *
 * Error Handling:
 * - 400: Pattern referenced in one or more sessions
 * - 404: Pattern not found
 *
 * Notes:
 * - Admin only endpoint.
 */
const deleteBreathingPattern = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Check if pattern is used in any sessions
		const sessionCount = await Session.countDocuments({
			"completePractice.pranayama": id,
		});

		if (sessionCount > 0) {
			throw createError(
				400,
				`Cannot delete: Pattern is used in ${sessionCount} sessions`,
			);
		}

		const pattern = await BreathingPattern.findByIdAndDelete(id);

		if (!pattern) {
			throw createError(404, "Breathing pattern not found");
		}

		return sendResponse(
			res,
			200,
			true,
			"Breathing pattern deleted successfully",
			null,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getDashboardStats (Admin)
 * --------------------------------------
 * Retrieves overall platform statistics for the admin dashboard.
 *
 * Workflow:
 * 1. Counts total documents across all collections.
 * 2. Counts new users registered this calendar month.
 * 3. Counts active users (lastPracticeDate within 30 days).
 * 4. Aggregates most popular VK families from sessions.
 * 5. Calculates average and total session duration.
 * 6. Aggregates daily session counts for the last 7 days.
 *
 * Response:
 * - users: { total, newThisMonth, active }
 * - content: { totalSessions, totalJournals, totalPoses, totalSequences, totalBreathingPatterns }
 * - sessions: { avgDuration, totalMinutes, perDay }
 * - popularFamilies: Array of { _id: family, count }
 *
 * Error Handling:
 * - Database errors passed to global handler via next(error)
 *
 * Notes:
 * - Admin only endpoint. No request parameters.
 * - Can be cached for performance (expensive aggregations).
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
 * Gets detailed practice analytics for a specific user.
 *
 * URL Parameters:
 * - userId: MongoDB ObjectId of the target user
 *
 * Workflow:
 * 1. Finds user by ID.
 * 2. Aggregates completed sessions by type (count + totalMinutes per type).
 * 3. Counts total journal entries for the user.
 * 4. Reads VK progression data from user document.
 * 5. Fetches 10 most recent sessions with populated sequences.
 *
 * Response:
 * - user: Basic profile + practice totals
 * - sessionsByType: Array of { _id: type, count, totalMinutes }
 * - journalCount: number
 * - vkProgression: { completedSequences, unlockedFamilies, currentLevel }
 * - recentSessions: Array of last 10 sessions
 *
 * Error Handling:
 * - 404: User not found
 *
 * Notes:
 * - Admin only endpoint.
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
