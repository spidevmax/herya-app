const express = require("express");
const {
	getJournalEntries,
	getJournalEntryById,
	createJournalEntry,
	updateJournalEntry,
	deleteJournalEntry,
	getDigitalGarden,
} = require("../controllers/journalEntry.controller");
const { authenticateToken } = require("../../middlewares/authorization.middleware");
const { handleValidationErrors } = require("../../middlewares/validation.middleware");
const { uploadJournalMixed } = require("../../middlewares/upload/journal.upload");
const { journalValidations } = require("../validations/journal.validations");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken());

// =============================
// CRUD OPERATIONS
// =============================

/**
 * @swagger
 * /api/v1/journal-entries:
 *   get:
 *     summary: Get all journal entries
 *     description: Get all journal entries for authenticated user with filters and pagination
 *     tags:
 *       - Journal Entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter until date (ISO format)
 *       - in: query
 *         name: sequenceFamily
 *         schema:
 *           type: string
 *         description: Filter by Vinyasa Krama family
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, energy]
 *           default: date
 *         description: Sort field
 *     responses:
 *       200:
 *         description: List of journal entries with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 journals:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
router.get("/", asyncErrorWrapper(getJournalEntries));

/**
 * @swagger
 * /api/v1/journal-entries:
 *   post:
 *     summary: Create journal entry
 *     description: Create new journal entry after a yoga session with optional photos and voice notes
 *     tags:
 *       - Journal Entries
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - session
 *               - moodBefore
 *               - moodAfter
 *               - energyLevel
 *               - stressLevel
 *             properties:
 *               session:
 *                 type: string
 *                 description: Session MongoDB ObjectId
 *               moodBefore:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [happy, peaceful, calm, energetic, anxious, tired, frustrated]
 *                 minItems: 1
 *                 description: Moods before practice
 *               moodAfter:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: Moods after practice
 *               energyLevel:
 *                 type: object
 *                 required:
 *                   - before
 *                   - after
 *                 properties:
 *                   before:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 10
 *                   after:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 10
 *               stressLevel:
 *                 type: object
 *                 required:
 *                   - before
 *                   - after
 *                 properties:
 *                   before:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 10
 *                   after:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 10
 *               physicalSensations:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Optional physical observations
 *               emotionalNotes:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Optional emotional reflections
 *               insights:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Optional practice insights
 *               gratitude:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional gratitude notes
 *               favoritePoses:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional favorite poses from session
 *               challengingPoses:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional challenging poses
 *               difficultyFeedback:
 *                 type: string
 *                 enum: [too_easy, just_right, too_hard]
 *                 description: Session difficulty feedback
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional photos (max 10, max 10MB each)
 *               voiceNotes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional voice notes (max 5, max 30MB each)
 *     responses:
 *       201:
 *         description: Journal entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Validation error or session already has journal
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - session belongs to different user
 *       404:
 *         description: Session not found
 *       500:
 *         description: Server error
 */
router.post(
	"/",
	uploadJournalMixed.fields([
		{ name: "photos", maxCount: 10 },
		{ name: "voiceNotes", maxCount: 5 },
	]),
	journalValidations,
	handleValidationErrors,
	asyncErrorWrapper(createJournalEntry),
);

/**
 * @swagger
 * /api/v1/journal-entries/digital-garden:
 *   get:
 *     summary: Get Digital Garden visualization data
 *     description: Get emotional trends, mood flowers visualization, and practice progress
 *     tags:
 *       - Journal Entries
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Digital garden data with mood visualization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 flowers:
 *                   type: array
 *                 trends:
 *                   type: object
 *                   properties:
 *                     emotional:
 *                       type: array
 *                     physical:
 *                       type: array
 *                 totalEntries:
 *                   type: integer
 *                 firstEntry:
 *                   type: string
 *                 latestEntry:
 *                   type: string
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
router.get("/digital-garden", asyncErrorWrapper(getDigitalGarden));

/**
 * @swagger
 * /api/v1/journal-entries/{id}:
 *   get:
 *     summary: Get journal entry by ID
 *     description: Get detailed journal entry (owner only)
 *     tags:
 *       - Journal Entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Journal entry MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Complete journal entry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - journal belongs to different user
 *       404:
 *         description: Journal not found
 *       500:
 *         description: Server error
 */
router.get("/:id", asyncErrorWrapper(getJournalEntryById));

/**
 * @swagger
 * /api/v1/journal-entries/{id}:
 *   put:
 *     summary: Update journal entry
 *     description: Update journal entry fields and/or add new media (owner only)
 *     tags:
 *       - Journal Entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Journal entry MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               moodBefore:
 *                 type: array
 *                 items:
 *                   type: string
 *               moodAfter:
 *                 type: array
 *                 items:
 *                   type: string
 *               energyLevel:
 *                 type: object
 *                 properties:
 *                   before:
 *                     type: integer
 *                   after:
 *                     type: integer
 *               stressLevel:
 *                 type: object
 *                 properties:
 *                   before:
 *                     type: integer
 *                   after:
 *                     type: integer
 *               physicalSensations:
 *                 type: string
 *               emotionalNotes:
 *                 type: string
 *               insights:
 *                 type: string
 *               gratitude:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               voiceNotes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Journal updated successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - journal belongs to different user
 *       404:
 *         description: Journal not found
 *       500:
 *         description: Server error
 */
router.put(
	"/:id",
	uploadJournalMixed.fields([
		{ name: "photos", maxCount: 10 },
		{ name: "voiceNotes", maxCount: 5 },
	]),
	asyncErrorWrapper(updateJournalEntry),
);

/**
 * @swagger
 * /api/v1/journal-entries/{id}:
 *   delete:
 *     summary: Delete journal entry
 *     description: Delete journal entry and all associated media from Cloudinary (owner only)
 *     tags:
 *       - Journal Entries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Journal entry MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Journal deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - journal belongs to different user
 *       404:
 *         description: Journal not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", asyncErrorWrapper(deleteJournalEntry));

module.exports = router;
