const Session = require("../models/Session.model");
const VKSequence = require("../models/VinyasaKramaSequence.model");
const User = require("../models/User.model");
const JournalEntry = require("../models/JournalEntry.model");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");
const { deleteImgCloudinary } = require("../../utils/deleteImage");

/**
 * Controller: createSession
 * -------------------------
 * Creates a new practice session for the authenticated user.
 *
 * Request Body:
 * - sessionType: "vk_sequence" | "pranayama" | "meditation" | "complete_practice"
 * - For vk_sequence: requires vkSequence (ObjectId)
 * - For complete_practice: requires completePractice object
 * - duration: number (required, min: 1)
 * - completed: boolean (default: false)
 * - notes: string (optional, max 1000 chars)
 *
 * Workflow:
 * 1. Validates sessionType and required fields based on type.
 * 2. Verifies referenced VK sequence exists (if provided).
 * 3. Creates Session document with user reference.
 * 4. Populates all references before returning.
 *
 * Response:
 * - Newly created session with populated vkSequence and completePractice references
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
		const { sessionType, vkSequence, completePractice, duration, plannedBlocks } = req.body;
		const isBlockBased = Array.isArray(plannedBlocks) && plannedBlocks.length > 0;

		// Validate required fields based on sessionType (skip for block-based sessions)
		if (!isBlockBased && sessionType === "vk_sequence" && !vkSequence) {
			throw createError(400, "vkSequence is required for vk_sequence session type");
		}

		if (!isBlockBased && sessionType === "complete_practice" && !completePractice) {
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

		// Keep user counters in sync when the session is created as completed.
		if (savedSession.completed) {
			await updateUserStats(req.user._id, savedSession);
		}

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
		const { id } = req.params;

		const session = await Session.findById(id);

		if (!session) {
			throw createError(404, "Session not found");
		}

		// Verify ownership
		if (session.user.toString() !== req.user._id.toString()) {
			throw createError(403, "You don't have access to this session");
		}

		// Save whether it was already completed before applying updates
		const wasAlreadyCompleted = session.completed;

		// Update allowed fields
		const allowedUpdates = ["completed", "duration", "actualPractice", "vkFeedback", "notes"];

		allowedUpdates.forEach((field) => {
			if (req.body[field] !== undefined) {
				session[field] = req.body[field];
			}
		});

		const updatedSession = await session.save();

		// Update user stats only when transitioning from incomplete → complete
		if (req.body.completed && !wasAlreadyCompleted) {
			await updateUserStats(req.user._id, updatedSession);
		}

		await updatedSession.populate("vkSequence");
		await updatedSession.populate("completePractice.warmup");
		await updatedSession.populate("completePractice.mainSequences");
		await updatedSession.populate("completePractice.cooldown");
		await updatedSession.populate("completePractice.pranayama");

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
 * 4. Cascade-deletes the associated journal entry (photos and voice notes cleaned up from Cloudinary).
 * 5. Decrements user stats if session was completed.
 *
 * Error Handling:
 * - 401: User not authenticated
 * - 403: Session belongs to different user
 * - 404: Session not found
 *
 * Notes:
 * - Journal entry deletion is best-effort: Cloudinary failures are logged but don't block the session delete.
 * - Adjust user stats accordingly.
 */
const deleteSession = async (req, res, next) => {
	try {
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

		// Cascade-delete the associated journal entry (avoids orphaned documents)
		const journal = await JournalEntry.findOne({ session: id });
		if (journal) {
			for (const photo of journal.photos) {
				try {
					if (photo.cloudinaryId) await deleteImgCloudinary(photo.cloudinaryId);
				} catch (_) {}
			}
			for (const voiceNote of journal.voiceNotes) {
				try {
					if (voiceNote.cloudinaryId) await deleteImgCloudinary(voiceNote.cloudinaryId);
				} catch (_) {}
			}
			await JournalEntry.findByIdAndDelete(journal._id);
		}

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

		// Tutor support insights from the last 4 weeks.
		const tutorSessions = await Session.find({
			user: req.user._id,
			date: { $gte: fourWeeksAgo },
			$or: [
				{ "checkIn.signal": { $in: ["green", "yellow", "red"] } },
				{ "tutorSupport.safePauseCount": { $gt: 0 } },
				{ "tutorSupport.anchorAvailable": true },
				{ "tutorSupport.anchorUsed": true },
			],
		})
			.select("_id date checkIn tutorSupport")
			.lean();

		const tutorSessionIds = tutorSessions.map((session) => session._id);
		const tutorJournals =
			tutorSessionIds.length > 0
				? await JournalEntry.find({
						user: req.user._id,
						session: { $in: tutorSessionIds },
					})
						.select("session signalAfter")
						.lean()
				: [];

		const journalSignalBySession = new Map(
			tutorJournals.map((journal) => [String(journal.session), journal.signalAfter]),
		);

		const signalRank = {
			green: 1,
			yellow: 2,
			red: 3,
		};

		const buildTutorInsights = (sessionsSlice) => {
			const insights = {
				sessionCount: sessionsSlice.length,
				totalSafePauses: 0,
				sessionsWithSafePause: 0,
				anchorAvailableSessions: 0,
				anchorUsedSessions: 0,
				anchorUseRate: 0,
				signalTransitionsCount: 0,
				signalImprovedCount: 0,
				signalSteadyCount: 0,
				signalWorsenedCount: 0,
				signalImprovementRate: 0,
			};

			sessionsSlice.forEach((session) => {
				const safePauseCount = Math.max(0, Number(session?.tutorSupport?.safePauseCount) || 0) || 0;
				const anchorAvailable = Boolean(session?.tutorSupport?.anchorAvailable);
				const anchorUsed = Boolean(session?.tutorSupport?.anchorUsed);

				insights.totalSafePauses += safePauseCount;
				if (safePauseCount > 0) insights.sessionsWithSafePause += 1;
				if (anchorAvailable) insights.anchorAvailableSessions += 1;
				if (anchorUsed) insights.anchorUsedSessions += 1;

				const beforeSignal = session?.checkIn?.signal;
				const afterSignal = journalSignalBySession.get(String(session._id));
				if (!beforeSignal || !afterSignal) return;
				if (!signalRank[beforeSignal] || !signalRank[afterSignal]) return;

				insights.signalTransitionsCount += 1;
				if (signalRank[afterSignal] < signalRank[beforeSignal]) {
					insights.signalImprovedCount += 1;
				} else if (signalRank[afterSignal] === signalRank[beforeSignal]) {
					insights.signalSteadyCount += 1;
				} else {
					insights.signalWorsenedCount += 1;
				}
			});

			insights.anchorUseRate =
				insights.anchorAvailableSessions > 0
					? Math.round((insights.anchorUsedSessions / insights.anchorAvailableSessions) * 100)
					: 0;

			insights.signalImprovementRate =
				insights.signalTransitionsCount > 0
					? Math.round((insights.signalImprovedCount / insights.signalTransitionsCount) * 100)
					: 0;

			return insights;
		};

		const tutorInsights = buildTutorInsights(tutorSessions);

		const currentWeekStart = new Date();
		currentWeekStart.setHours(0, 0, 0, 0);
		currentWeekStart.setDate(currentWeekStart.getDate() - 6);

		const previousWeekStart = new Date(currentWeekStart);
		previousWeekStart.setDate(previousWeekStart.getDate() - 7);

		const currentWeekTutorSessions = tutorSessions.filter(
			(session) => new Date(session.date) >= currentWeekStart,
		);
		const previousWeekTutorSessions = tutorSessions.filter((session) => {
			const sessionDate = new Date(session.date);
			return sessionDate >= previousWeekStart && sessionDate < currentWeekStart;
		});

		const currentWeekInsights = buildTutorInsights(currentWeekTutorSessions);
		const previousWeekInsights = buildTutorInsights(previousWeekTutorSessions);

		tutorInsights.weeklyTrend = {
			currentWeek: currentWeekInsights,
			previousWeek: previousWeekInsights,
			delta: {
				sessionCount: currentWeekInsights.sessionCount - previousWeekInsights.sessionCount,
				totalSafePauses: currentWeekInsights.totalSafePauses - previousWeekInsights.totalSafePauses,
				anchorUseRate: currentWeekInsights.anchorUseRate - previousWeekInsights.anchorUseRate,
				signalImprovementRate:
					currentWeekInsights.signalImprovementRate - previousWeekInsights.signalImprovementRate,
			},
		};

		const getTutorRecommendation = (insights) => {
			const sessions = insights.sessionCount || 0;
			const transitions = insights.signalTransitionsCount || 0;

			if ((insights.sessionCount || 0) < 2) {
				return {
					key: "collect_more_data",
					severity: "info",
					preset: "tutor",
					confidence: "low",
				};
			}

			if ((insights.anchorAvailableSessions || 0) > 0 && (insights.anchorUseRate || 0) < 50) {
				return {
					key: "increase_anchor_prompts",
					severity: "warning",
					preset: "tutor",
					confidence: transitions >= 3 ? "high" : "medium",
				};
			}

			if (
				(insights.signalImprovementRate || 0) < 40 &&
				(insights.weeklyTrend?.delta?.signalImprovementRate || 0) < 0
			) {
				return {
					key: "prioritize_short_coregulation",
					severity: "warning",
					preset: "tutor",
					confidence: transitions >= 3 ? "high" : "medium",
				};
			}

			if (
				(insights.signalImprovementRate || 0) >= 70 &&
				(insights.weeklyTrend?.delta?.signalImprovementRate || 0) >= 0
			) {
				return {
					key: "maintain_current_plan",
					severity: "success",
					preset: "adult",
					confidence: sessions >= 4 && transitions >= 3 ? "high" : "medium",
				};
			}

			return {
				key: "keep_consistent_routine",
				severity: "info",
				preset: "adult",
				confidence: sessions >= 3 ? "medium" : "low",
			};
		};

		tutorInsights.recommendation = getTutorRecommendation(tutorInsights);

		const recommendationAppliedSessions = await Session.find({
			user: req.user._id,
			date: { $gte: fourWeeksAgo },
			"recommendationContext.applied": true,
			"recommendationContext.source": "dashboard_tutor_insights",
		})
			.select("_id checkIn recommendationContext")
			.lean();

		const appliedSessionIds = recommendationAppliedSessions.map((session) => session._id);
		const appliedSessionJournals =
			appliedSessionIds.length > 0
				? await JournalEntry.find({
						user: req.user._id,
						session: { $in: appliedSessionIds },
					})
						.select("session signalAfter")
						.lean()
				: [];

		const appliedSignalBySession = new Map(
			appliedSessionJournals.map((journal) => [String(journal.session), journal.signalAfter]),
		);

		const recommendationOutcome = {
			appliedCount: recommendationAppliedSessions.length,
			withSignalOutcome: 0,
			improvedCount: 0,
			improvedRate: 0,
			byPreset: {
				adult: 0,
				tutor: 0,
			},
		};

		recommendationAppliedSessions.forEach((session) => {
			const preset = session?.recommendationContext?.preset;
			if (preset === "adult") recommendationOutcome.byPreset.adult += 1;
			if (preset === "tutor") recommendationOutcome.byPreset.tutor += 1;

			const beforeSignal = session?.checkIn?.signal;
			const afterSignal = appliedSignalBySession.get(String(session._id));
			if (!beforeSignal || !afterSignal) return;
			if (!signalRank[beforeSignal] || !signalRank[afterSignal]) return;

			recommendationOutcome.withSignalOutcome += 1;
			if (signalRank[afterSignal] < signalRank[beforeSignal]) {
				recommendationOutcome.improvedCount += 1;
			}
		});

		recommendationOutcome.improvedRate =
			recommendationOutcome.withSignalOutcome > 0
				? Math.round(
						(recommendationOutcome.improvedCount / recommendationOutcome.withSignalOutcome) * 100,
					)
				: 0;

		tutorInsights.recommendationOutcome = recommendationOutcome;

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
			tutorInsights,
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

	const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
	const toUtcDay = (value) => {
		const date = new Date(value);
		return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	};

	const sessionDay = toUtcDay(session.date);
	const lastPracticeDay = user.lastPracticeDate ? toUtcDay(user.lastPracticeDate) : null;

	// Calculate streak using practice dates (not server-local "today").
	if (!lastPracticeDay) {
		user.currentStreak = 1;
	} else {
		const daysDiff = Math.floor((sessionDay - lastPracticeDay) / MILLIS_PER_DAY);

		if (daysDiff === 1) {
			user.currentStreak += 1;
		} else if (daysDiff > 1) {
			user.currentStreak = 1;
		}
		// daysDiff <= 0: same day or backdated session, keep streak unchanged.
	}

	if (!user.lastPracticeDate || new Date(session.date) > new Date(user.lastPracticeDate)) {
		user.lastPracticeDate = session.date;
	}

	await user.save();
}

/**
 * Controller: startSession
 * Transitions a planned session to active status, recording the start time.
 */
const startSession = async (req, res, next) => {
	try {
		const session = await Session.findById(req.params.id);
		if (!session) throw createError(404, "Session not found");
		if (session.user.toString() !== req.user._id.toString())
			throw createError(403, "Access denied");

		if (session.status !== "planned" && session.status !== "paused")
			throw createError(400, "Session cannot be started from current status");

		const now = new Date();
		session.status = "active";

		if (!session.timerData.startedAt) {
			session.timerData.startedAt = now;
			session.timerData.blockStartedAt = now;
		} else {
			// Resuming from pause
			const pausedMs = now - session.timerData.pausedAt;
			session.timerData.totalPausedMs += pausedMs;
			session.timerData.blockPausedMs += pausedMs;
			session.timerData.pausedAt = undefined;
		}

		const saved = await session.save();
		return sendResponse(res, 200, true, "Session started", saved);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: pauseSession
 */
const pauseSession = async (req, res, next) => {
	try {
		const session = await Session.findById(req.params.id);
		if (!session) throw createError(404, "Session not found");
		if (session.user.toString() !== req.user._id.toString())
			throw createError(403, "Access denied");
		if (session.status !== "active") throw createError(400, "Only active sessions can be paused");

		session.status = "paused";
		session.timerData.pausedAt = new Date();
		const saved = await session.save();
		return sendResponse(res, 200, true, "Session paused", saved);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: advanceBlock
 * Moves to the next or previous block in the session.
 */
const advanceBlock = async (req, res, next) => {
	try {
		const session = await Session.findById(req.params.id);
		if (!session) throw createError(404, "Session not found");
		if (session.user.toString() !== req.user._id.toString())
			throw createError(403, "Access denied");

		const { direction = "next" } = req.body;
		const currentIdx = session.timerData.currentBlockIndex || 0;
		const maxIdx = session.plannedBlocks.length - 1;

		let newIdx;
		if (direction === "next") {
			newIdx = Math.min(currentIdx + 1, maxIdx);
		} else {
			newIdx = Math.max(currentIdx - 1, 0);
		}

		session.timerData.currentBlockIndex = newIdx;
		session.timerData.blockStartedAt = new Date();
		session.timerData.blockPausedMs = 0;

		const saved = await session.save();
		return sendResponse(res, 200, true, "Block advanced", saved);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: completeGuidedSession
 * Finalises a guided session, calculating actual duration and completion rate.
 */
const completeGuidedSession = async (req, res, next) => {
	try {
		const session = await Session.findById(req.params.id);
		if (!session) throw createError(404, "Session not found");
		if (session.user.toString() !== req.user._id.toString())
			throw createError(403, "Access denied");

		const now = new Date();
		const startedAt = session.timerData.startedAt || now;
		let totalPausedMs = session.timerData.totalPausedMs || 0;

		// If currently paused, add the last pause segment
		if (session.status === "paused" && session.timerData.pausedAt) {
			totalPausedMs += now - session.timerData.pausedAt;
		}

		const elapsedMs = now - startedAt - totalPausedMs;
		const actualMinutes = Math.max(1, Math.round(elapsedMs / 60000));

		const blocksCompleted = req.body?.blocksCompleted ?? session.plannedBlocks.length;
		const completionRate =
			session.plannedBlocks.length > 0
				? Math.round((blocksCompleted / session.plannedBlocks.length) * 100)
				: 100;

		session.status = "completed";
		session.completed = true;
		session.actualDuration = actualMinutes;
		session.completionRate = completionRate;
		if (req.body?.tutorSupport) {
			session.tutorSupport = {
				safePauseCount: Math.max(0, Number(req.body?.tutorSupport?.safePauseCount) || 0),
				anchorAvailable: Boolean(req.body?.tutorSupport?.anchorAvailable),
				anchorUsed: Boolean(req.body?.tutorSupport?.anchorUsed),
			};
		}
		if (req.body?.notes) session.notes = req.body.notes;

		const saved = await session.save();
		await updateUserStats(req.user._id, saved);

		return sendResponse(res, 200, true, "Session completed", saved);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: abandonSession
 */
const abandonSession = async (req, res, next) => {
	try {
		const session = await Session.findById(req.params.id);
		if (!session) throw createError(404, "Session not found");
		if (session.user.toString() !== req.user._id.toString())
			throw createError(403, "Access denied");

		session.status = "abandoned";
		session.completed = false;

		if (session.timerData.startedAt) {
			const now = new Date();
			let totalPausedMs = session.timerData.totalPausedMs || 0;
			if (session.timerData.pausedAt) {
				totalPausedMs += now - session.timerData.pausedAt;
			}
			session.actualDuration = Math.max(
				1,
				Math.round((now - session.timerData.startedAt - totalPausedMs) / 60000),
			);
		}

		const blocksCompleted = session.timerData.currentBlockIndex || 0;
		session.completionRate =
			session.plannedBlocks.length > 0
				? Math.round((blocksCompleted / session.plannedBlocks.length) * 100)
				: 0;

		if (req.body?.tutorSupport) {
			session.tutorSupport = {
				safePauseCount: Math.max(0, Number(req.body?.tutorSupport?.safePauseCount) || 0),
				anchorAvailable: Boolean(req.body?.tutorSupport?.anchorAvailable),
				anchorUsed: Boolean(req.body?.tutorSupport?.anchorUsed),
			};
		}

		const saved = await session.save();
		return sendResponse(res, 200, true, "Session abandoned", saved);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getActiveSession
 * Returns the user's most recent active or paused session (for recovery).
 */
const getActiveSession = async (req, res, next) => {
	try {
		const session = await Session.findOne({
			user: req.user._id,
			status: { $in: ["active", "paused", "planned"] },
		})
			.sort({ updatedAt: -1 })
			.populate("plannedBlocks.vkSequence")
			.populate("plannedBlocks.breathingPattern");

		return sendResponse(
			res,
			200,
			true,
			session ? "Active session found" : "No active session",
			session,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getPracticeAnalytics
 * Returns analytics: start vs finish rate, avg duration by type, most-used blocks, abandonment by phase.
 */
const getPracticeAnalytics = async (req, res, next) => {
	try {
		const userId = req.user._id;

		const [totals, byType, blockUsage] = await Promise.all([
			Session.aggregate([
				{ $match: { user: userId } },
				{
					$group: {
						_id: null,
						total: { $sum: 1 },
						completed: {
							$sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
						},
						abandoned: {
							$sum: { $cond: [{ $eq: ["$status", "abandoned"] }, 1, 0] },
						},
						avgDuration: { $avg: "$actualDuration" },
					},
				},
			]),
			Session.aggregate([
				{ $match: { user: userId, status: "completed" } },
				{
					$group: {
						_id: "$sessionType",
						count: { $sum: 1 },
						avgDuration: { $avg: "$actualDuration" },
						avgCompletion: { $avg: "$completionRate" },
					},
				},
			]),
			Session.aggregate([
				{ $match: { user: userId, status: "completed" } },
				{ $unwind: "$plannedBlocks" },
				{
					$group: {
						_id: {
							blockType: "$plannedBlocks.blockType",
							label: "$plannedBlocks.label",
						},
						count: { $sum: 1 },
					},
				},
				{ $sort: { count: -1 } },
				{ $limit: 10 },
			]),
		]);

		const stats = totals[0] || {
			total: 0,
			completed: 0,
			abandoned: 0,
			avgDuration: 0,
		};

		return sendResponse(res, 200, true, "Analytics retrieved", {
			completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
			abandonmentRate: stats.total > 0 ? Math.round((stats.abandoned / stats.total) * 100) : 0,
			avgDuration: Math.round(stats.avgDuration || 0),
			totalSessions: stats.total,
			byType: byType.map((t) => ({
				type: t._id,
				count: t.count,
				avgDuration: Math.round(t.avgDuration || 0),
				avgCompletion: Math.round(t.avgCompletion || 0),
			})),
			mostUsedBlocks: blockUsage.map((b) => ({
				blockType: b._id.blockType,
				label: b._id.label,
				count: b.count,
			})),
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	createSession,
	getSessions,
	getSessionById,
	updateSession,
	deleteSession,
	getSessionStats,
	startSession,
	pauseSession,
	advanceBlock,
	completeGuidedSession,
	abandonSession,
	getActiveSession,
	getPracticeAnalytics,
};
