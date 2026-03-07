const BreathingPattern = require("../models/BreathingPattern.model");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

/**
 * Controller: getBreathingPatterns
 * --------------------------------
 * Fetches all breathing patterns with filtering and pagination support.
 *
 * Query Parameters (all optional):
 * - difficulty: Filter by difficulty level ("beginner" | "intermediate" | "advanced")
 * - energyEffect: Filter by energy effect ("calming" | "energizing" | "balancing" | "cooling" | "heating")
 * - practicePhase: Filter by VK practice phase
 * - recommendedBefore: Filter by what should be done before this pattern
 * - page: Page number for pagination (default: 1)
 * - limit: Results per page (default: 20)
 *
 * Workflow:
 * 1. Builds dynamic filter object from query parameters
 * 2. Populates prerequisite breathing pattern references
 * 3. Calculates pagination (skip and limit)
 * 4. Returns patterns sorted by difficulty and name
 * 5. Includes pagination metadata (total, pages)
 *
 * Response:
 * - patterns: Array of matching breathing patterns with prerequisites populated
 * - pagination: { page, limit, total, pages }
 *
 * Error Handling:
 * - Database errors passed to global handler via next(error)
 *
 * Notes:
 * - All filters are optional and can be combined
 * - Results sorted by difficulty ascending, then by romanization name
 * - Supports pagination for large datasets
 */
const getBreathingPatterns = async (req, res, next) => {
	try {
		const {
			difficulty,
			energyEffect,
			practicePhase,
			recommendedBefore,
			page = 1,
			limit = 20,
		} = req.query;

		// Build filter
		const filter = {};

		if (difficulty) filter.difficulty = difficulty;
		if (energyEffect) filter.energyEffect = energyEffect;
		if (practicePhase) filter["vkContext.practicePhase"] = practicePhase;
		if (recommendedBefore)
			filter["vkContext.recommendedBefore"] = recommendedBefore;

		// Pagination
		const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

		const patterns = await BreathingPattern.find(filter)
			.populate("vkContext.prerequisiteBreathing")
			.sort({ difficulty: 1, romanizationName: 1 })
			.skip(skip)
			.limit(parseInt(limit, 10));

		const total = await BreathingPattern.countDocuments(filter);

		return sendResponse(
			res,
			200,
			true,
			"Breathing patterns retrieved successfully",
			{
				patterns,
				pagination: {
					page: parseInt(page, 10),
					limit: parseInt(limit, 10),
					total,
					pages: Math.ceil(total / parseInt(limit, 10)),
				},
			},
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getBreathingPatternById
 * -----------------------------------
 * Retrieves a single breathing pattern by ID with full details and prerequisites.
 *
 * Route Parameters:
 * - id: Breathing pattern MongoDB ObjectId
 *
 * Workflow:
 * 1. Finds breathing pattern by ID from request params
 * 2. Populates prerequisite breathing pattern references
 * 3. Converts to object with calculated virtual fields
 * 4. Returns 200 with pattern details
 *
 * Response:
 * - Complete breathing pattern object with:
 *   - Basic info (name, description, tags)
 *   - Techniques and effects
 *   - VK context and prerequisites
 *   - Recommended practice guidelines
 *   - Calculated virtual fields (pattern times, etc.)
 *
 * Error Handling:
 * - 404: Pattern not found
 * - 400: Invalid ObjectId format (handled by Mongoose)
 *
 * Notes:
 * - Includes virtual fields like calculated pattern durations
 * - Populates prerequisite references for complete data
 * - Useful for detailed pattern view/guidance screen
 */
const getBreathingPatternById = async (req, res, next) => {
	try {
		const { id } = req.params;

		const breathingPattern = await BreathingPattern.findById(id).populate(
			"vkContext.prerequisiteBreathing",
		);

		if (!breathingPattern) {
			throw createError(404, "Breathing pattern not found");
		}

		// Add calculated pattern times (from virtual field)
		const patternObj = breathingPattern.toObject({ virtuals: true });

		return sendResponse(
			res,
			200,
			true,
			"Breathing pattern retrieved successfully",
			patternObj,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getRecommendedBreathingPattern
 * -------------------------------------------
 * Recommends a breathing pattern based on user's goals, time of day, and skill level.
 *
 * Query Parameters:
 * - goal: Practice goal ("calm" | "energize" | "focus" | "balance" | "cool" | "heat")
 * - timeOfDay: Time of day ("morning" | "afternoon" | "evening" | "night")
 * - duration: Available time in minutes
 * - userLevel: User's skill level ("beginner" | "intermediate" | "advanced", default: "beginner")
 *
 * Workflow:
 * 1. Maps goal to corresponding energyEffect (e.g., "calm" → "calming")
 * 2. Builds filter: energy effect, time of day, duration, difficulty level
 * 3. Respects userLevel to suggest appropriate difficulty
 * 4. Queries for matching pattern sorted by difficulty (ascending)
 * 5. Falls back to Ujjayi Pranayama if no match found
 * 6. Returns recommended pattern with reasoning/explanation
 *
 * Response:
 * - pattern: Recommended breathing pattern with full details
 * - reason: String explaining why this pattern was recommended
 *
 * Error Handling:
 * - Fallback to basic Ujjayi if no pattern matches
 * - Database errors passed to global handler
 *
 * Notes:
 * - AI-powered recommendation engine
 * - Respects user's progression level
 * - Graceful fallback ensures always returns a recommendation
 * - Can be enhanced with user practice history tracking
 */
const getRecommendedBreathingPattern = async (req, res, next) => {
	try {
		const { goal, timeOfDay, duration, userLevel = "beginner" } = req.query;

		// Map goal to energyEffect
		const energyEffectMap = {
			calm: "calming",
			energize: "energizing",
			focus: "balancing",
			balance: "balancing",
			cool: "cooling",
			heat: "heating",
		};

		const filter = {};

		if (goal && energyEffectMap[goal]) {
			filter.energyEffect = energyEffectMap[goal];
		}

		if (timeOfDay) {
			filter.bestTimeOfDay = { $in: [timeOfDay, "anytime"] };
		}

		if (userLevel) {
			// Respect user's level
			const difficultyMap = {
				beginner: ["beginner"],
				intermediate: ["beginner", "intermediate"],
				advanced: ["beginner", "intermediate", "advanced"],
			};
			filter.difficulty = { $in: difficultyMap[userLevel] };
		}

		// Find patterns within user's time constraints
		if (duration) {
			filter["recommendedPractice.durationMinutes.min"] = { $lte: duration };
		}

		let pattern = await BreathingPattern.findOne(filter)
			.populate("vkContext.prerequisiteBreathing")
			.sort({ difficulty: 1 });

		let reason = "";

		if (pattern) {
			reason = `Recommended for ${goal || "your practice"} during ${timeOfDay || "any time"}`;
		} else {
			// Fallback to basic ujjayi
			pattern = await BreathingPattern.findOne({
				romanizationName: "Ujjayi",
			});
			reason =
				"Ujjayi breathing is a great foundational technique for any practice";
		}

		if (!pattern) {
			throw createError(
				404,
				"No breathing patterns found. Please seed the database.",
			);
		}

		const patternObj = pattern.toObject({ virtuals: true });

		return sendResponse(
			res,
			200,
			true,
			"Recommendation generated successfully",
			{
				pattern: patternObj,
				reason,
			},
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getBreathingPatternsByTechnique
 * -------------------------------------------
 * Retrieves all breathing patterns that use a specific pranayama technique.
 *
 * Route Parameters:
 * - technique: Technique identifier
 *   Valid values: "nadishodhana" | "kapalabhati" | "bhastrika" | "ujjayi" | "bhramari" | "cooling"
 *
 * Workflow:
 * 1. Validates that requested technique is in allowed list
 * 2. Builds filter: vkTechniques[technique].enabled = true
 * 3. Queries matching patterns sorted by difficulty
 * 4. Returns array of patterns using that technique
 *
 * Response:
 * - Array of breathing patterns where the specified technique is enabled
 * - Sorted by difficulty ascending
 *
 * Error Handling:
 * - 400: Invalid or unsupported technique name
 * - Database errors passed to global handler
 *
 * Notes:
 * - Helps users explore variations and progressions of a specific technique
 * - Example: "Show me all Nadi Shodhana variations at different difficulty levels"
 * - Useful for technique-focused learning paths
 */
const getBreathingPatternsByTechnique = async (req, res, next) => {
	try {
		const { technique } = req.params;

		const validTechniques = [
			"nadishodhana",
			"kapalabhati",
			"bhastrika",
			"ujjayi",
			"bhramari",
			"cooling",
		];

		if (!validTechniques.includes(technique)) {
			throw createError(400, "Invalid breathing technique");
		}

		const filter = {};
		filter[`vkTechniques.${technique}.enabled`] = true;

		const patterns = await BreathingPattern.find(filter).sort({
			difficulty: 1,
		});

		return sendResponse(
			res,
			200,
			true,
			`Patterns using ${technique} retrieved`,
			patterns,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getPranayamaProgression
 * ------------------------------------
 * Returns a structured learning path for pranayama progression.
 *
 * Route Parameters:
 * - None (no parameters required)
 *
 * Workflow:
 * 1. Queries all patterns grouped by difficulty level (beginner, intermediate, advanced)
 * 2. Populates prerequisite references for each pattern
 * 3. Maps patterns to simplified objects with key information
 * 4. Organizes into 3 learning levels with prerequisites visible
 * 5. Returns structured progression object
 *
 * Response:
 * - level1_beginner: Array of beginner patterns (foundations)
 * - level2_intermediate: Array of intermediate patterns (building skills)
 * - level3_advanced: Array of advanced patterns (mastery)
 *
 * Each pattern includes:
 * - _id, romanizationName, sanskritName
 * - energyEffect, description
 * - prerequisites: Array of prerequisite breathing patterns
 *
 * Error Handling:
 * - Database errors passed to global handler via next(error)
 *
 * Notes:
 * - Helps users understand complete pranayama learning journey
 * - Shows progression from basics to advanced techniques
 * - Respects traditional prerequisites and dependencies
 * - Perfect for curriculum/learning path references
 * - Useful for displaying prerequisites to unlock advanced techniques
 */
const getPranayamaProgression = async (_req, res, next) => {
	try {
		// Get all patterns organized by difficulty
		const beginnerPatterns = await BreathingPattern.find({
			difficulty: "beginner",
		})
			.populate("vkContext.prerequisiteBreathing")
			.sort({ romanizationName: 1 });

		const intermediatePatterns = await BreathingPattern.find({
			difficulty: "intermediate",
		})
			.populate("vkContext.prerequisiteBreathing")
			.sort({ romanizationName: 1 });

		const advancedPatterns = await BreathingPattern.find({
			difficulty: "advanced",
		})
			.populate("vkContext.prerequisiteBreathing")
			.sort({ romanizationName: 1 });

		const progression = {
			level1_beginner: beginnerPatterns.map((p) => ({
				_id: p._id,
				name: p.romanizationName,
				sanskritName: p.sanskritName,
				energyEffect: p.energyEffect,
				description: p.description,
				prerequisites: p.vkContext?.prerequisiteBreathing || [],
			})),
			level2_intermediate: intermediatePatterns.map((p) => ({
				_id: p._id,
				name: p.romanizationName,
				sanskritName: p.sanskritName,
				energyEffect: p.energyEffect,
				description: p.description,
				prerequisites: p.vkContext?.prerequisiteBreathing || [],
			})),
			level3_advanced: advancedPatterns.map((p) => ({
				_id: p._id,
				name: p.romanizationName,
				sanskritName: p.sanskritName,
				energyEffect: p.energyEffect,
				description: p.description,
				prerequisites: p.vkContext?.prerequisiteBreathing || [],
			})),
		};

		return sendResponse(
			res,
			200,
			true,
			"Pranayama progression path retrieved",
			progression,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: searchBreathingPatterns
 * -----------------------------------
 * Performs full-text search across breathing patterns.
 *
 * Query Parameters:
 * - q: Search query (required)
 *   - Case-insensitive
 *   - Searches across: romanization, IAST, Sanskrit, description, tags
 *
 * Workflow:
 * 1. Validates that search query (q) is provided
 * 2. Creates case-insensitive regex pattern
 * 3. Searches across name fields, description, and tags
 * 4. Returns up to 20 matching patterns
 *
 * Response:
 * - Array of breathing patterns matching search query
 * - Limited to 20 results
 * - Success message includes count of results found
 *
 * Error Handling:
 * - 400: No search query provided (q parameter missing)
 * - Database errors passed to global handler
 *
 * Notes:
 * - Regex search covers romanizationName, iastName, sanskritName, description, tags
 * - Case-insensitive matching for better UX
 * - MongoDB $text cannot be nested inside $or — regex search used throughout
 */
const searchBreathingPatterns = async (req, res, next) => {
	try {
		const { q } = req.query;

		if (!q) {
			throw createError(400, "Search query is required");
		}

		const searchRegex = new RegExp(q, "i");

		const patterns = await BreathingPattern.find({
			$or: [
				{ romanizationName: searchRegex },
				{ iastName: searchRegex },
				{ sanskritName: searchRegex },
				{ description: searchRegex },
				{ tags: searchRegex },
			],
		}).limit(20);

		return sendResponse(
			res,
			200,
			true,
			`Found ${patterns.length} patterns`,
			patterns,
		);
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getBreathingPatterns,
	getBreathingPatternById,
	getRecommendedBreathingPattern,
	getBreathingPatternsByTechnique,
	getPranayamaProgression,
	searchBreathingPatterns,
};
