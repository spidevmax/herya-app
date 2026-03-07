const express = require("express");
const {
	createSession,
	getSessions,
	getSessionById,
	updateSession,
	deleteSession,
	getSessionStats,
} = require("../controllers/session.controller");
const {
	authenticateToken,
} = require("../../middlewares/authorization.middleware");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");
const {
	handleValidationErrors,
} = require("../../middlewares/validation.middleware");
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
 *                 totalDuration:
 *                   type: integer
 *                 averageDuration:
 *                   type: number
 *                 lastSessionDate:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
router.get("/stats", asyncErrorWrapper(getSessionStats));

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
router.get(
	"/",
	sessionPaginationValidation,
	handleValidationErrors,
	asyncErrorWrapper(getSessions),
);

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
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: When the session started (optional)
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: When the session ended (optional)
 *               completed:
 *                 type: boolean
 *                 description: Whether the session was completed (default false)
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional session notes
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
router.post(
	"/",
	createSessionValidations,
	handleValidationErrors,
	asyncErrorWrapper(createSession),
);

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
router.get(
	"/:id",
	sessionIdValidation,
	handleValidationErrors,
	asyncErrorWrapper(getSessionById),
);

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
	asyncErrorWrapper(updateSession),
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
router.delete(
	"/:id",
	sessionIdValidation,
	handleValidationErrors,
	asyncErrorWrapper(deleteSession),
);

module.exports = router;
