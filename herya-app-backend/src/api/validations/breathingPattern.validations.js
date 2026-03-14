const { query, param } = require("express-validator");

/**
 * Validation Rules: getBreathingPatternsValidation
 * -----------------------------------------------
 * Validates query parameters for listing breathing patterns.
 *
 * Query Parameters:
 * - difficulty: Optional, one of: beginner, intermediate, advanced
 * - energyEffect: Optional, one of: calming, energizing, balancing, cooling, heating
 * - practicePhase: Optional, one of: opening, mid_practice, closing, anytime
 * - recommendedBefore: Optional, valid VK family name
 * - page: Optional, positive integer (default: 1)
 * - limit: Optional, integer 1-100 (default: 20)
 *
 * @example
 * router.get("/", getBreathingPatternsValidation, handleValidationErrors, getBreathingPatterns);
 */
const getBreathingPatternsValidation = [
	query("difficulty")
		.optional()
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be one of: beginner, intermediate, advanced"),

	query("energyEffect")
		.optional()
		.isIn(["calming", "energizing", "balancing", "cooling", "heating"])
		.withMessage(
			"Energy effect must be one of: calming, energizing, balancing, cooling, heating",
		),

	query("practicePhase")
		.optional()
		.isIn(["opening", "mid_practice", "closing", "anytime"])
		.withMessage(
			"Practice phase must be one of: opening, mid_practice, closing, anytime",
		),

	query("recommendedBefore")
		.optional()
		.isIn([
			"tadasana",
			"standing_asymmetric",
			"standing_symmetric",
			"one_leg_standing",
			"seated",
			"supine",
			"prone",
			"inverted",
			"meditative",
			"bow_sequence",
			"triangle_sequence",
			"sun_salutation",
			"vajrasana_variations",
			"lotus_variations",
		])
		.withMessage("Invalid VK family for recommendedBefore"),

	query("page")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Page must be a positive integer"),

	query("limit")
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage("Limit must be between 1 and 100"),
];

/**
 * Validation Rules: breathingPatternIdValidation
 * -----------------------------------------------
 * Validates breathing pattern ID parameter.
 *
 * @example
 * router.get("/:id", breathingPatternIdValidation, handleValidationErrors, getBreathingPatternById);
 */
const breathingPatternIdValidation = [
	param("id")
		.notEmpty()
		.withMessage("Breathing pattern ID is required")
		.isMongoId()
		.withMessage("Breathing pattern ID must be a valid MongoDB ID"),
];

/**
 * Validation Rules: breathingPatternTechniqueValidation
 * -------------------------------------------------------
 * Validates breathing technique parameter.
 *
 * Valid Techniques:
 * - nadishodhana, kapalabhati, bhastrika, ujjayi, bhramari, cooling
 *
 * @example
 * router.get("/technique/:technique", breathingPatternTechniqueValidation, handleValidationErrors, getBreathingPatternsByTechnique);
 */
const breathingPatternTechniqueValidation = [
	param("technique")
		.notEmpty()
		.withMessage("Technique is required")
		.isIn([
			"nadishodhana",
			"kapalabhati",
			"bhastrika",
			"ujjayi",
			"bhramari",
			"cooling",
		])
		.withMessage(
			"Invalid breathing technique. Must be one of: nadishodhana, kapalabhati, bhastrika, ujjayi, bhramari, cooling",
		),
];

/**
 * Validation Rules: recommendedBreathingPatternValidation
 * -------------------------------------------------------
 * Validates query parameters for breathing pattern recommendations.
 *
 * Query Parameters:
 * - goal: Optional, one of: calm, energize, focus, balance, cool, heat
 * - timeOfDay: Optional, one of: morning, afternoon, evening, night
 * - duration: Optional, positive integer (minutes)
 * - userLevel: Optional, one of: beginner, intermediate, advanced (default: beginner)
 *
 * @example
 * router.get("/recommended", recommendedBreathingPatternValidation, handleValidationErrors, getRecommendedBreathingPattern);
 */
const recommendedBreathingPatternValidation = [
	query("goal")
		.optional()
		.isIn(["calm", "energize", "focus", "balance", "cool", "heat"])
		.withMessage(
			"Goal must be one of: calm, energize, focus, balance, cool, heat",
		),

	query("timeOfDay")
		.optional()
		.isIn(["morning", "afternoon", "evening", "night"])
		.withMessage(
			"Time of day must be one of: morning, afternoon, evening, night",
		),

	query("duration")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Duration must be a positive integer"),

	query("userLevel")
		.optional()
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("User level must be one of: beginner, intermediate, advanced"),
];

/**
 * Validation Rules: searchBreathingPatternValidation
 * --------------------------------------------------
 * Validates search query for breathing patterns.
 *
 * Query Parameters:
 * - q: Required, search query string (min 2 chars)
 *
 * @example
 * router.get("/search", searchBreathingPatternValidation, handleValidationErrors, searchBreathingPatterns);
 */
const searchBreathingPatternValidation = [
	query("q")
		.notEmpty()
		.withMessage("Search query is required")
		.isLength({ min: 2 })
		.withMessage("Search query must be at least 2 characters"),
];

module.exports = {
	getBreathingPatternsValidation,
	breathingPatternIdValidation,
	breathingPatternTechniqueValidation,
	recommendedBreathingPatternValidation,
	searchBreathingPatternValidation,
};
