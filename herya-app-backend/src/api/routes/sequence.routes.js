const express = require("express");
const { authenticateToken } = require("../../middlewares/authorization.middleware");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");
const { handleValidationErrors } = require("../../middlewares/validation.middleware");

const {
	getSequences,
	getSequenceById,
	getSequencesByFamily,
	getRecommendedSequence,
	searchSequences,
} = require("../controllers/sequence.controller");

const {
	sequenceIdValidation,
	familyIdValidation,
	getSequencesValidation,
	searchSequencesValidation,
} = require("../validations/sequence.validations");

const router = express.Router();

/**
 * @swagger
 * /api/v1/sequences/search:
 *   get:
 *     summary: Search sequences
 *     description: Search Vinyasa Krama sequences by name and description
 *     tags:
 *       - Sequences
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: standing mountain
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Invalid search query
 *       500:
 *         description: Server error
 */
router.get(
	"/search",
	searchSequencesValidation,
	handleValidationErrors,
	asyncErrorWrapper(searchSequences),
);

/**
 * @swagger
 * /api/v1/sequences/stats/recommended:
 *   get:
 *     summary: Get recommended sequence
 *     description: Get Vinyasa Krama sequence recommendation for authenticated user based on experience level
 *     tags:
 *       - Sequences
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended sequence
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
router.get("/stats/recommended", authenticateToken(), asyncErrorWrapper(getRecommendedSequence));

/**
 * @swagger
 * /api/v1/sequences/family/{family}:
 *   get:
 *     summary: Get sequences by family
 *     description: Get all Vinyasa Krama sequences for a specific family
 *     tags:
 *       - Sequences
 *     parameters:
 *       - in: path
 *         name: family
 *         required: true
 *         schema:
 *           type: string
 *         description: VK family identifier (e.g., "standing_mountain", "sitting", "inverted")
 *     responses:
 *       200:
 *         description: Sequences in the family
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Invalid family ID
 *       500:
 *         description: Server error
 */
router.get(
	"/family/:family",
	familyIdValidation,
	handleValidationErrors,
	asyncErrorWrapper(getSequencesByFamily),
);

/**
 * @swagger
 * /api/v1/sequences:
 *   get:
 *     summary: Get all sequences
 *     description: Get all Vinyasa Krama sequences with filtering and pagination
 *     tags:
 *       - Sequences
 *     parameters:
 *       - in: query
 *         name: family
 *         schema:
 *           type: string
 *         description: Filter by VK family
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *         description: Filter by duration in minutes
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of sequences with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sequences:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get("/", getSequencesValidation, handleValidationErrors, asyncErrorWrapper(getSequences));

/**
 * @swagger
 * /api/v1/sequences/{id}:
 *   get:
 *     summary: Get sequence by ID
 *     description: Get detailed Vinyasa Krama sequence with all poses and annotations
 *     tags:
 *       - Sequences
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sequence MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Complete sequence details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid sequence ID format
 *       404:
 *         description: Sequence not found
 *       500:
 *         description: Server error
 */
router.get(
	"/:id",
	sequenceIdValidation,
	handleValidationErrors,
	asyncErrorWrapper(getSequenceById),
);

module.exports = router;
