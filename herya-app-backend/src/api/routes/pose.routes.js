const express = require("express");
const {
	handleValidationErrors,
} = require("../../middlewares/validation.middleware");

const {
	getPoses,
	getPoseById,
	getPosesByCategory,
	searchPoses,
	getRelatedPoses,
	getPosesByVKFamily,
} = require("../controllers/pose.controller");

const {
	poseIdValidation,
	categoryParamValidation,
	familyParamValidation,
	getPosesValidation,
	searchPosesValidation,
} = require("../validations/pose.validations");

const posesRouter = express.Router();

// =============================
// PUBLIC GET ROUTES (no authentication required)
// =============================

/**
 * @swagger
 * /api/v1/poses/search:
 *   get:
 *     summary: Search poses by keyword
 *     description: Full-text search across pose name fields and tags. Must be placed before category/:category
 *     tags:
 *       - Poses
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (searches name, romanization, IAST, Sanskrit, aliases, tags)
 *         example: downward dog
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Optional difficulty filter
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Optional category filter
 *     responses:
 *       200:
 *         description: Search results (max 20 poses, ranked by relevance)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Missing search query or invalid parameters
 *       500:
 *         description: Server error
 */
posesRouter.get(
	"/search",
	searchPosesValidation,
	handleValidationErrors,
	searchPoses,
);

/**
 * @swagger
 * /api/v1/poses/category/{category}:
 *   get:
 *     summary: Get poses by VK category
 *     description: Get all poses in a specific Vinyasa Krama category
 *     tags:
 *       - Poses
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [standing_mountain, standing_asymmetric, sitting, inverted, prone, supine]
 *         description: Vinyasa Krama category
 *         example: standing_mountain
 *     responses:
 *       200:
 *         description: Poses in category (sorted by difficulty then name)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       400:
 *         description: Invalid category
 *       500:
 *         description: Server error
 */
posesRouter.get(
	"/category/:category",
	categoryParamValidation,
	handleValidationErrors,
	getPosesByCategory,
);

/**
 * @swagger
 * /api/v1/poses/family/{family}:
 *   get:
 *     summary: Get poses by VK family
 *     description: Get all poses that appear in a specific Vinyasa Krama family, grouped by pose role
 *     tags:
 *       - Poses
 *     parameters:
 *       - in: path
 *         name: family
 *         required: true
 *         schema:
 *           type: string
 *         description: Vinyasa Krama family (tadasana, standing_asymmetric, sitting, inverted, etc.)
 *         example: tadasana
 *     responses:
 *       200:
 *         description: Poses grouped by role (primary, transition, counterpose, preparation)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 primary:
 *                   type: array
 *                 transition:
 *                   type: array
 *                 counterpose:
 *                   type: array
 *                 preparation:
 *                   type: array
 *       400:
 *         description: Invalid VK family
 *       500:
 *         description: Server error
 */
posesRouter.get(
	"/family/:family",
	familyParamValidation,
	handleValidationErrors,
	getPosesByVKFamily,
);

/**
 * @swagger
 * /api/v1/poses:
 *   get:
 *     summary: Get all poses with filtering
 *     description: Get all poses with optional filtering and pagination
 *     tags:
 *       - Poses
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by pose category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filter by difficulty level
 *       - in: query
 *         name: vkFamily
 *         schema:
 *           type: string
 *         description: Filter by Vinyasa Krama family
 *       - in: query
 *         name: sidedness
 *         schema:
 *           type: string
 *         description: Filter by sidedness (asymmetric, symmetric, etc.)
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
 *           default: 50
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of poses with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 poses:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       400:
 *         description: Invalid parameters
 *       500:
 *         description: Server error
 */
posesRouter.get("/", getPosesValidation, handleValidationErrors, getPoses);

/**
 * @swagger
 * /api/v1/poses/{id}/related:
 *   get:
 *     summary: Get related poses
 *     description: Get preparatory, follow-up, and counterpose suggestions for a given pose
 *     tags:
 *       - Poses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pose MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Related poses grouped by relationship type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 basePose:
 *                   type: object
 *                 preparatoryPoses:
 *                   type: array
 *                 followUpPoses:
 *                   type: array
 *                 counterposes:
 *                   type: array
 *       400:
 *         description: Invalid pose ID format
 *       404:
 *         description: Pose not found
 *       500:
 *         description: Server error
 */
posesRouter.get(
	"/:id/related",
	poseIdValidation,
	handleValidationErrors,
	getRelatedPoses,
);

/**
 * @swagger
 * /api/v1/poses/{id}:
 *   get:
 *     summary: Get pose by ID
 *     description: Get detailed pose information with all relationships populated
 *     tags:
 *       - Poses
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pose MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Complete pose data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid pose ID format
 *       404:
 *         description: Pose not found
 *       500:
 *         description: Server error
 */
posesRouter.get("/:id", poseIdValidation, handleValidationErrors, getPoseById);

module.exports = posesRouter;
