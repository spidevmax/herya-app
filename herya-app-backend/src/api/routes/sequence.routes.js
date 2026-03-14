const express = require("express");
const {
	authenticateToken,
	optionalAuth,
} = require("../../middlewares/authorization.middleware");
const {
	handleValidationErrors,
} = require("../../middlewares/validation.middleware");

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
 *       - in: query
 *         name: family
 *         schema:
 *           type: string
 *           enum: [tadasana, standing_asymmetric, standing_symmetric, one_leg_standing, seated, supine, prone, inverted, meditative, bow_sequence, triangle_sequence, sun_salutation, vajrasana_variations, lotus_variations]
 *         description: Optional filter by VK family
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Optional filter by difficulty
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
	searchSequences,
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
router.get("/stats/recommended", authenticateToken(), getRecommendedSequence);

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
 *         description: VK family identifier (e.g., "tadasana", "standing_asymmetric", "seated", "inverted")
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
	optionalAuth,
	getSequencesByFamily,
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
 *           enum: [tadasana, standing_asymmetric, standing_symmetric, one_leg_standing, seated, supine, prone, inverted, meditative, bow_sequence, triangle_sequence, sun_salutation, vajrasana_variations, lotus_variations]
 *         description: Filter by VK family
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *         description: Filter by progression level
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty
 *       - in: query
 *         name: unlocked
 *         schema:
 *           type: boolean
 *         description: "If true and user is authenticated, only return sequences the user can access"
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
router.get(
	"/",
	getSequencesValidation,
	handleValidationErrors,
	optionalAuth,
	getSequences,
);

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
	getSequenceById,
);

module.exports = router;
