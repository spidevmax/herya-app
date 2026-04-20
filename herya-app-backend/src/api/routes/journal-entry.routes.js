const express = require("express");
const {
	getJournalEntries,
	getJournalEntryById,
	createJournalEntry,
	updateJournalEntry,
	deleteJournalEntry,
} = require("../controllers/journalEntry.controller");
const {
	authenticateToken,
} = require("../../middlewares/authorization.middleware");
const {
	handleValidationErrors,
} = require("../../middlewares/validation.middleware");
const {
	uploadJournalMixed,
} = require("../../middlewares/upload/journal.upload");
const {
	journalValidations,
	journalIdValidation,
	getJournalEntriesValidation,
	updateJournalValidations,
} = require("../validations/journal.validations");

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
 *           enum: [tadasana, standing_asymmetric, standing_symmetric, one_leg_standing, seated, supine, prone, inverted, meditative, bow_sequence, triangle_sequence, sun_salutation, vajrasana_variations, lotus_variations]
 *         description: Filter by Vinyasa Krama family
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [date, mood, energy]
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
router.get(
	"/",
	getJournalEntriesValidation,
	handleValidationErrors,
	getJournalEntries,
);

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
 *                   enum: [calm, anxious, energized, tired, focused, stressed, happy, sad, grounded, restless, peaceful, overwhelmed, motivated, discouraged, scattered, irritated]
 *                 minItems: 1
 *                 description: Moods before practice (up to 16 options)
 *               moodAfter:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [calm, anxious, energized, tired, focused, stressed, happy, sad, grounded, restless, peaceful, overwhelmed, motivated, discouraged, scattered, irritated, renewed, centered, light, clear]
 *                 minItems: 1
 *                 description: Moods after practice (up to 20 options, includes 4 exclusive post-practice moods)
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
 *               pacingFeedback:
 *                 type: string
 *                 enum: [too_slow, perfect, too_fast]
 *                 description: Session pacing feedback
 *               bodyAreas:
 *                 type: array
 *                 description: Physical sensations per body area
 *               vkReflection:
 *                 type: object
 *                 description: VK-specific progression reflection
 *                 properties:
 *                   sequenceFamily:
 *                     type: string
 *                     enum: [tadasana, standing_asymmetric, standing_symmetric, one_leg_standing, seated, supine, prone, inverted, meditative, bow_sequence, triangle_sequence, sun_salutation, vajrasana_variations, lotus_variations]
 *                   sequenceLevel:
 *                     type: integer
 *                     enum: [1, 2, 3]
 *                   progressionNotes:
 *                     type: string
 *                     maxLength: 1000
 *                   anatomicalObservations:
 *                     type: array
 *                   readyForNextLevel:
 *                     type: boolean
 *               nextSessionGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 500
 *                 description: Goals for the next practice session
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional tags for categorisation
 *               voiceNoteDuration:
 *                 type: integer
 *                 description: Duration in seconds applied to all uploaded voice notes
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional photos (max 10, max 5MB each)
 *               voiceNotes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional voice notes (max 5, max 10MB each)
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
	createJournalEntry,
);

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
router.get(
	"/:id",
	journalIdValidation,
	handleValidationErrors,
	getJournalEntryById,
);

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
 *                   enum: [calm, anxious, energized, tired, focused, stressed, happy, sad, grounded, restless, peaceful, overwhelmed, motivated, discouraged, scattered, irritated]
 *               moodAfter:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [calm, anxious, energized, tired, focused, stressed, happy, sad, grounded, restless, peaceful, overwhelmed, motivated, discouraged, renewed, centered, light, clear, scattered, irritated]
 *               energyLevel:
 *                 type: object
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
 *               emotionalNotes:
 *                 type: string
 *                 maxLength: 2000
 *               insights:
 *                 type: string
 *                 maxLength: 2000
 *               gratitude:
 *                 type: string
 *                 maxLength: 1000
 *               bodyAreas:
 *                 type: array
 *                 description: Physical sensations per body area
 *               favoritePoses:
 *                 type: array
 *                 description: Favorite poses from the session
 *               challengingPoses:
 *                 type: array
 *                 description: Challenging poses from the session
 *               difficultyFeedback:
 *                 type: string
 *                 enum: [too_easy, just_right, too_hard]
 *               pacingFeedback:
 *                 type: string
 *                 enum: [too_slow, perfect, too_fast]
 *               vkReflection:
 *                 type: object
 *                 description: VK-specific progression reflection
 *               nextSessionGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               voiceNoteDuration:
 *                 type: integer
 *                 description: Duration in seconds applied to all new voice notes
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New photos to add (additive)
 *               voiceNotes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New voice notes to add (additive)
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
	journalIdValidation,
	updateJournalValidations,
	handleValidationErrors,
	updateJournalEntry,
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
router.delete(
	"/:id",
	journalIdValidation,
	handleValidationErrors,
	deleteJournalEntry,
);

module.exports = router;
