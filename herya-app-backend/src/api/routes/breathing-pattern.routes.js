const express = require("express");
const { handleValidationErrors } = require("../../middlewares/validation.middleware");

const {
	getBreathingPatterns,
	getBreathingPatternById,
	getRecommendedBreathingPattern,
	getBreathingPatternsByTechnique,
	getPranayamaProgression,
	searchBreathingPatterns,
} = require("../controllers/breathingPattern.controller");

const {
	getBreathingPatternsValidation,
	breathingPatternIdValidation,
	breathingPatternTechniqueValidation,
	recommendedBreathingPatternValidation,
	searchBreathingPatternValidation,
} = require("../validations/breathingPattern.validations");

const router = express.Router();

/**
 * @swagger
 * /api/v1/breathing-patterns/search:
 *   get:
 *     summary: Search breathing patterns
 *     description: Search breathing patterns by name, description, and tags
 *     tags:
 *       - Breathing Patterns
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (min 2 characters)
 *         example: ujjayi
 *     responses:
 *       200:
 *         description: Search results (max 20 patterns)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Invalid or missing search query
 *       500:
 *         description: Server error
 */
router.get(
	"/search",
	searchBreathingPatternValidation,
	handleValidationErrors,
	searchBreathingPatterns,
);

/**
 * @swagger
 * /api/v1/breathing-patterns/recommended:
 *   get:
 *     summary: Get recommended breathing pattern
 *     description: Get breathing pattern recommendation based on goals and user level
 *     tags:
 *       - Breathing Patterns
 *     parameters:
 *       - in: query
 *         name: goal
 *         schema:
 *           type: string
 *           enum: [calm, energize, focus, balance, cool, heat]
 *         description: Practice goal
 *       - in: query
 *         name: timeOfDay
 *         schema:
 *           type: string
 *           enum: [morning, afternoon, evening, night]
 *         description: Time of day
 *       - in: query
 *         name: duration
 *         schema:
 *           type: integer
 *         description: Available time in minutes
 *       - in: query
 *         name: userLevel
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           default: beginner
 *         description: User skill level
 *     responses:
 *       200:
 *         description: Recommended pattern with rationale
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pattern:
 *                   type: object
 *                 reason:
 *                   type: string
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get(
	"/recommended",
	recommendedBreathingPatternValidation,
	handleValidationErrors,
	getRecommendedBreathingPattern,
);

/**
 * @swagger
 * /api/v1/breathing-patterns/progression:
 *   get:
 *     summary: Get pranayama learning progression
 *     description: Get breathing patterns organized by learning levels (beginner to advanced)
 *     tags:
 *       - Breathing Patterns
 *     responses:
 *       200:
 *         description: Pranayama progression by level
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 level1_beginner:
 *                   type: array
 *                 level2_intermediate:
 *                   type: array
 *                 level3_advanced:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get("/progression", getPranayamaProgression);

/**
 * @swagger
 * /api/v1/breathing-patterns/technique/{technique}:
 *   get:
 *     summary: Get patterns by technique
 *     description: Get all breathing patterns using a specific breathing technique
 *     tags:
 *       - Breathing Patterns
 *     parameters:
 *       - in: path
 *         name: technique
 *         required: true
 *         schema:
 *           type: string
 *           enum: [nadishodhana, kapalabhati, bhastrika, ujjayi, bhramari, cooling]
 *         description: Breathing technique name
 *     responses:
 *       200:
 *         description: Patterns using the specified technique
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Invalid technique name
 *       500:
 *         description: Server error
 */
router.get(
	"/technique/:technique",
	breathingPatternTechniqueValidation,
	handleValidationErrors,
	getBreathingPatternsByTechnique,
);

/**
 * @swagger
 * /api/v1/breathing-patterns:
 *   get:
 *     summary: Get all breathing patterns
 *     description: Get all breathing patterns with filtering and pagination
 *     tags:
 *       - Breathing Patterns
 *     parameters:
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: energyEffect
 *         schema:
 *           type: string
 *           enum: [calming, energizing, balancing, cooling, heating]
 *         description: Filter by energy effect
 *       - in: query
 *         name: practicePhase
 *         schema:
 *           type: string
 *           enum: [opening, mid_practice, closing, anytime]
 *         description: Filter by VK practice phase
 *       - in: query
 *         name: recommendedBefore
 *         schema:
 *           type: string
 *           enum: [tadasana, standing_asymmetric, standing_symmetric, one_leg_standing, seated, supine, prone, inverted, meditative, bow_sequence, triangle_sequence, sun_salutation, vajrasana_variations, lotus_variations]
 *         description: Filter by VK family this pattern is recommended before
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
 *           maximum: 100
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of breathing patterns with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patterns:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
router.get("/", getBreathingPatternsValidation, handleValidationErrors, getBreathingPatterns);

/**
 * @swagger
 * /api/v1/breathing-patterns/{id}:
 *   get:
 *     summary: Get breathing pattern by ID
 *     description: Get detailed breathing pattern information with prerequisites
 *     tags:
 *       - Breathing Patterns
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Breathing pattern MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Complete breathing pattern with prerequisites populated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid pattern ID format
 *       404:
 *         description: Pattern not found
 *       500:
 *         description: Server error
 */
router.get("/:id", breathingPatternIdValidation, handleValidationErrors, getBreathingPatternById);

module.exports = router;
