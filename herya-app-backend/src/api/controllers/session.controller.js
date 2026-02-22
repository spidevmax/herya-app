const Session = require("../models/Session.model");
const VKSequence = require("../models/VinyasaKramaSequence.model");
const User = require("../models/User.model");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

/**
 * Controller: createSession
 * -------------------------
 * Creates a new practice session for the authenticated user.
 *
 * Workflow:
 * 1. Validates sessionType and required fields based on type.
 * 2. Creates Session document with user reference.
 * 3. Increments user's totalSessions counter.
 * 4. Returns created session.
 *
 * Request Body:
 * - sessionType: "vk_sequence" | "pranayama" | "meditation" | "complete_practice"
 * - For vk_sequence: requires vkSequence (ObjectId)
 * - For complete_practice: requires completePractice object
 * - duration: number (required)
 * - completed: boolean (default: false)
 *
 * Error Handling:
 * - 400: Missing required fields or invalid sessionType
 * - 401: User not authenticated
 * - 404: Referenced sequence not found
 *
 * Notes:
 * - Session is created when practice STARTS, not when it ends.
 * - completed flag should be updated when practice finishes.
 * - Duration can be estimated or updated at completion.
 */
const createSession = async (req, res, next) => {
	try {
		if (!req.user) {
			throw createError(401, "Authentication required");
		}

		const { sessionType, vkSequence, completePractice, duration } = req.body;

		// Validate required fields based on sessionType
		if (sessionType === "vk_sequence" && !vkSequence) {
			throw createError(400, "vkSequence is required for vk_sequence session type");
		}

		if (sessionType === "complete_practice" && !completePractice) {
			throw createError(400, "completePractice is required for complete_practice session type");
		}

		if (!duration) {
			throw createError(400, "Duration is required");
		}

		// Verify VK sequence exists if provided
		if (vkSequence) {
			const sequence = await VKSequence.findById(vkSequence);
			if (!sequence) {
				throw createError(404, "VK Sequence not found");
			}
		}

		// Create session
		const session = new Session({
			...req.body,
			user: req.user._id,
		});

		const savedSession = await session.save();

		// Populate references before returning
		await savedSession.populate("vkSequence");
		await savedSession.populate("completePractice.warmup");
		await savedSession.populate("completePractice.mainSequences");
		await savedSession.populate("completePractice.cooldown");
		await savedSession.populate("completePractice.pranayama");

		return sendResponse(res, 201, true, "Session created successfully", savedSession);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getSessions
 * ----------------------------
 * Retrieves all sessions for the authenticated user with pagination.
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20)
 * - sessionType: Filter by type
 * - completed: Filter by completion status (true/false)
 * - startDate: Filter sessions from this date
 * - endDate: Filter sessions until this date
 *
 * Workflow:
 * 1. Builds filter based on query params.
 * 2. Paginates results.
 * 3. Populates VK sequence references.
 * 4. Returns sessions with pagination metadata.
 *
 * Error Handling:
 * - 401: User not authenticated
 * - Invalid date formats
 *
 * Notes:
 * - Sorted by date descending (most recent first).
 * - Useful for practice history/calendar view.
 */
const getSessions = async (req, res, next) => {
	try {
		if (!req.user) {
			throw createError(401, "Authentication required");
		}

		const { page = 1, limit = 20, sessionType, completed, startDate, endDate } = req.query;

		// Build filter
		const filter = { user: req.user._id };

		if (sessionType) filter.sessionType = sessionType;
		if (completed !== undefined) filter.completed = completed === "true";

		// Date range filter
		if (startDate || endDate) {
			filter.date = {};
			if (startDate) filter.date.$gte = new Date(startDate);
			if (endDate) filter.date.$lte = new Date(endDate);
		}

		// Pagination
		const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

		const sessions = await Session.find(filter)
			.populate("vkSequence")
			.populate("completePractice.warmup")
			.populate("completePractice.mainSequences")
			.populate("completePractice.cooldown")
			.populate("completePractice.pranayama")
			.sort({ date: -1 })
			.skip(skip)
			.limit(parseInt(limit, 10));

		const total = await Session.countDocuments(filter);

		return sendResponse(res, 200, true, "Sessions retrieved successfully", {
			sessions,
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
 * Controller: getSessionById
 * ---------------------------
 * Retrieves a single session by ID.
 *
 * Workflow:
 * 1. Finds session by ID.
 * 2. Verifies session belongs to authenticated user.
 * 3. Populates all references.
 * 4. Returns complete session data.
 *
 * Error Handling:
 * - 401: User not authenticated
 * - 403: Session belongs to different user
 * - 404: Session not found
 *
 * Notes:
 * - Full population for detailed view.
 * - Includes all poses, sequences, and patterns.
 */
const getSessionById = async (req, res, next) => {
	try {
		if (!req.user) {
			throw createError(401, "Authentication required");
		}

		const { id } = req.params;

		const session = await Session.findById(id)
			.populate("vkSequence")
			.populate("completePractice.warmup")
			.populate("completePractice.mainSequences")
			.populate("completePractice.cooldown")
			.populate("completePractice.pranayama")
			.populate("actualPractice.posesModified.originalPose")
			.populate("actualPractice.posesModified.usedVariation")
			.populate("actualPractice.skippedPoses.pose");

		if (!session) {
			throw createError(404, "Session not found");
		}

		// Verify ownership
		if (session.user.toString() !== req.user._id.toString()) {
			throw createError(403, "You don't have access to this session");
		}

		return sendResponse(res, 200, true, "Session retrieved successfully", session);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: updateSession
 * --------------------------
 * Updates an existing session (typically to mark as completed).
 *
 * Workflow:
 * 1. Finds session by ID.
 * 2. Verifies ownership.
 * 3. Updates allowed fields.
 * 4. If marking as completed, updates user stats.
 * 5. Returns updated session.
 *
 * Updatable Fields:
 * - completed: boolean
 * - duration: number (actual duration)
 * - actualPractice: object (modifications made)
 * - vkFeedback: object
 * - notes: string
 *
 * Error Handling:
 * - 401: User not authenticated
 * - 403: Session belongs to different user
 * - 404: Session not found
 *
 * Notes:
 * - Typically called when user finishes practice.
 * - Updates user's totalSessions and totalMinutes.
 * - Triggers streak calculation.
 */
const updateSession = async (req, res, next) => {
	try {
		if (!req.user) {
			throw createError(401, "Authentication required");
		}

		const { id } = req.params;

		const session = await Session.findById(id);

		if (!session) {
			throw createError(404, "Session not found");
		}

		// Verify ownership
		if (session.user.toString() !== req.user._id.toString()) {
			throw createError(403, "You don't have access to this session");
		}

		// Update allowed fields
		const allowedUpdates = ["completed", "duration", "actualPractice", "vkFeedback", "notes"];

		allowedUpdates.forEach((field) => {
			if (req.body[field] !== undefined) {
				session[field] = req.body[field];
			}
		});

		const updatedSession = await session.save();

		// Update user stats if marking as completed
		if (req.body.completed && !session.completed) {
			await updateUserStats(req.user._id, updatedSession);
		}

		await updatedSession.populate("vkSequence");

		return sendResponse(res, 200, true, "Session updated successfully", updatedSession);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: deleteSession
 * --------------------------
 * Deletes a session.
 *
 * Workflow:
 * 1. Finds session by ID.
 * 2. Verifies ownership.
 * 3. Deletes session.
 * 4. Updates user stats (decrements counts).
 * 5. Note: Related journal entry should be handled separately.
 *
 * Error Handling:
 * - 401: User not authenticated
 * - 403: Session belongs to different user
 * - 404: Session not found
 *
 * Notes:
 * - Consider soft delete with isDeleted flag.
 * - Cascade delete or orphan journal entries.
 * - Adjust user stats accordingly.
 */
const deleteSession = async (req, res, next) => {
	try {
		if (!req.user) {
			throw createError(401, "Authentication required");
		}

		const { id } = req.params;

		const session = await Session.findById(id);

		if (!session) {
			throw createError(404, "Session not found");
		}

		// Verify ownership
		if (session.user.toString() !== req.user._id.toString()) {
			throw createError(403, "You don't have access to this session");
		}

		await Session.findByIdAndDelete(id);

		// Update user stats if session was completed
		if (session.completed) {
			await User.findByIdAndUpdate(req.user._id, {
				$inc: {
					totalSessions: -1,
					totalMinutes: -session.duration,
				},
			});
		}

		return sendResponse(res, 200, true, "Session deleted successfully", null);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getSessionStats
 * ----------------------------
 * Gets aggregate statistics for user's sessions.
 *
 * Returns:
 * - Total sessions by type
 * - Total minutes practiced
 * - Average session duration
 * - Sessions per week (last 4 weeks)
 * - Most practiced VK families
 * - Current streak
 *
 * Workflow:
 * 1. Runs MongoDB aggregation pipeline.
 * 2. Calculates various metrics.
 * 3. Returns comprehensive stats.
 *
 * Error Handling:
 * - 401: User not authenticated
 *
 * Notes:
 * - Useful for dashboard/analytics view.
 * - Can be cached for performance.
 */
const getSessionStats = async (req, res, next) => {
	try {
		if (!req.user) {
			throw createError(401, "Authentication required");
		}

		// Get user for basic stats
		const user = await User.findById(req.user._id);

		// Aggregate sessions by type
		const sessionsByType = await Session.aggregate([
			{ $match: { user: req.user._id, completed: true } },
			{ $group: { _id: "$sessionType", count: { $sum: 1 } } },
		]);

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
			sessionsByType: sessionsByType.reduce((acc, item) => {
				acc[item._id] = item.count;
				return acc;
			}, {}),
			sessionsPerWeek,
			mostPracticedFamilies,
			avgDuration,
			lastPracticeDate: user.lastPracticeDate,
		});
	} catch (error) {
		return next(error);
	}
};

/**
 * Helper Function: updateUserStats
 * ---------------------------------
 * Updates user statistics when a session is completed.
 *
 * Updates:
 * - totalSessions
 * - totalMinutes
 * - lastPracticeDate
 * - currentStreak
 * - vkProgression (if applicable)
 */
async function updateUserStats(userId, session) {
	const user = await User.findById(userId);

	// Increment totals
	user.totalSessions += 1;
	user.totalMinutes += session.duration;

	// Update last practice date
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const lastPractice = user.lastPracticeDate ? new Date(user.lastPracticeDate) : null;
	if (lastPractice) {
		lastPractice.setHours(0, 0, 0, 0);
	}

	// Calculate streak
	if (!lastPractice) {
		user.currentStreak = 1;
	} else {
		const daysDiff = Math.floor((today - lastPractice) / (1000 * 60 * 60 * 24));

		if (daysDiff === 0) {
			// Same day, no change
		} else if (daysDiff === 1) {
			// Consecutive day
			user.currentStreak += 1;
		} else {
			// Streak broken
			user.currentStreak = 1;
		}
	}

	user.lastPracticeDate = session.date;

	await user.save();
}

module.exports = {
	createSession,
	getSessions,
	getSessionById,
	updateSession,
	deleteSession,
	getSessionStats,
};
