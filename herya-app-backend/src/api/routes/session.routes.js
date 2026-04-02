const express = require("express");
const {
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
} = require("../controllers/session.controller");
const { authenticateToken } = require("../../middlewares/authorization.middleware");
const { handleValidationErrors } = require("../../middlewares/validation.middleware");
const {
	createSessionValidations,
	updateSessionValidations,
	sessionIdValidation,
	sessionPaginationValidation,
} = require("../validations/session.validations");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken());

/**
 * @swagger
 * /api/v1/sessions/stats:
 *   get:
 *     summary: Get session statistics
 *     description: Get user's practice statistics (total sessions, duration, frequency)
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User session statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSessions:
 *                   type: integer
 *                   description: All-time completed session count (from User document)
 *                 totalMinutes:
 *                   type: integer
 *                   description: All-time practice minutes (from User document)
 *                 currentStreak:
 *                   type: integer
 *                   description: Consecutive practice days streak
 *                 sessionsByType:
 *                   type: object
 *                   description: Count of completed sessions per type (vk_sequence, pranayama, etc.)
 *                 sessionsPerWeek:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: Session count per week for last 4 weeks (index 0 = oldest)
 *                 mostPracticedFamilies:
 *                   type: array
 *                   description: Top 5 VK families by session count (last 4 weeks)
 *                 avgDuration:
 *                   type: integer
 *                   description: Average session duration in minutes (last 4 weeks)
 *                 lastPracticeDate:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
router.get("/stats", getSessionStats);
router.get("/active/current", getActiveSession);
router.get("/analytics/practice", getPracticeAnalytics);

/**
 * @swagger
 * /api/v1/sessions:
 *   get:
 *     summary: Get user's sessions
 *     description: Get all sessions for authenticated user with pagination
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *       - in: query
 *         name: sessionType
 *         schema:
 *           type: string
 *           enum: [vk_sequence, pranayama, meditation, complete_practice]
 *         description: Filter by session type
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sessions from this date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sessions until this date (ISO format)
 *     responses:
 *       200:
 *         description: User's sessions with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
router.get("/", sessionPaginationValidation, handleValidationErrors, getSessions);

/**
 * @swagger
 * /api/v1/sessions:
 *   post:
 *     summary: Create new session
 *     description: Create a new yoga practice session
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionType
 *               - duration
 *             properties:
 *               sessionType:
 *                 type: string
 *                 enum: [vk_sequence, pranayama, meditation, complete_practice]
 *                 description: Type of practice session
 *               vkSequence:
 *                 type: string
 *                 description: VK Sequence MongoDB ObjectId (required when sessionType is vk_sequence)
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *                 description: Session duration in minutes
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Date of practice (defaults to now if omitted)
 *               completed:
 *                 type: boolean
 *                 description: Whether the session was completed (default false)
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional session notes
 *               completePractice:
 *                 type: object
 *                 description: Required when sessionType is complete_practice
 *                 properties:
 *                   warmup:
 *                     type: string
 *                     description: VKSequence ObjectId for warmup
 *                   mainSequences:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Array of VKSequence ObjectIds (at least one required)
 *                   cooldown:
 *                     type: string
 *                     description: VKSequence ObjectId for cooldown
 *                   pranayama:
 *                     type: string
 *                     description: BreathingPattern ObjectId
 *                   meditation:
 *                     type: object
 *                     properties:
 *                       duration:
 *                         type: integer
 *                         description: Meditation duration in minutes
 *                       meditationType:
 *                         type: string
 *                         description: Type of meditation practiced
 *               actualPractice:
 *                 type: object
 *                 description: Modifications made during practice
 *                 properties:
 *                   repetitionsCompleted:
 *                     type: integer
 *                     description: Number of repetitions completed
 *                   posesModified:
 *                     type: array
 *                     description: Poses that were replaced with variations
 *                   skippedPoses:
 *                     type: array
 *                     description: Poses that were skipped
 *               vkFeedback:
 *                 type: object
 *                 description: VK-specific feedback (for vk_sequence sessions)
 *                 properties:
 *                   sequenceChallenge:
 *                     type: string
 *                     enum: [too_easy, appropriate, too_challenging]
 *                   vinyasaPace:
 *                     type: string
 *                     enum: [too_slow, perfect, too_fast]
 *                   breathComfort:
 *                     type: string
 *                     enum: [comfortable, slightly_strained, very_difficult]
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: Sequence not found
 *       500:
 *         description: Server error
 */
router.post("/", createSessionValidations, handleValidationErrors, createSession);

/**
 * @swagger
 * /api/v1/sessions/{id}:
 *   get:
 *     summary: Get session by ID
 *     description: Get detailed session information (user owner only)
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Complete session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid session ID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - session belongs to different user
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.get("/:id", sessionIdValidation, handleValidationErrors, getSessionById);

/**
 * @swagger
 * /api/v1/sessions/{id}:
 *   put:
 *     summary: Update session
 *     description: Update session details (user owner only)
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               completed:
 *                 type: boolean
 *                 description: Mark session as completed
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *                 description: Actual session duration in minutes
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Session notes
 *               actualPractice:
 *                 type: object
 *                 description: Modifications made during practice
 *                 properties:
 *                   repetitionsCompleted:
 *                     type: integer
 *                   posesModified:
 *                     type: array
 *                   skippedPoses:
 *                     type: array
 *               vkFeedback:
 *                 type: object
 *                 description: VK-specific session feedback
 *                 properties:
 *                   sequenceChallenge:
 *                     type: string
 *                     enum: [too_easy, appropriate, too_challenging]
 *                   vinyasaPace:
 *                     type: string
 *                     enum: [too_slow, perfect, too_fast]
 *                   breathComfort:
 *                     type: string
 *                     enum: [comfortable, slightly_strained, very_difficult]
 *     responses:
 *       200:
 *         description: Session updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - session belongs to different user
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.put(
	"/:id",
	sessionIdValidation,
	updateSessionValidations,
	handleValidationErrors,
	updateSession,
);

/**
 * @swagger
 * /api/v1/sessions/{id}:
 *   delete:
 *     summary: Delete session
 *     description: Delete session (user owner only)
 *     tags:
 *       - Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - session belongs to different user
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", sessionIdValidation, handleValidationErrors, deleteSession);

// ── Guided Practice Flow ─────────────────────────────────────────────────────
router.post("/:id/start", sessionIdValidation, handleValidationErrors, startSession);
router.post("/:id/pause", sessionIdValidation, handleValidationErrors, pauseSession);
router.post("/:id/advance-block", sessionIdValidation, handleValidationErrors, advanceBlock);
router.post("/:id/complete", sessionIdValidation, handleValidationErrors, completeGuidedSession);
router.post("/:id/abandon", sessionIdValidation, handleValidationErrors, abandonSession);

module.exports = router;
