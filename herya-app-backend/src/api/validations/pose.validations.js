const { query, param } = require("express-validator");

/**
 * Validation Rules: poseIdValidation
 * ----------------------------------
 * Validates pose ID parameter.
 *
 * @example
 * router.get("/:id", poseIdValidation, handleValidationErrors, getPoseById);
 */
const poseIdValidation = [
	param("id")
		.notEmpty()
		.withMessage("Pose ID is required")
		.isMongoId()
		.withMessage("Pose ID must be a valid MongoDB ID"),
];

/**
 * Validation Rules: categoryParamValidation
 * ------------------------------------------
 * Validates category parameter.
 *
 * @example
 * router.get("/category/:category", categoryParamValidation, handleValidationErrors, getPosesByCategory);
 */
const categoryParamValidation = [
	param("category")
		.notEmpty()
		.withMessage("Category is required")
		.isIn([
			"standing_mountain",
			"standing_asymmetric",
			"standing_symmetric",
			"one_leg_balance",
			"seated_forward",
			"seated_twist",
			"seated_hip_opener",
			"supine",
			"prone",
			"inverted",
			"arm_support",
			"backbend",
			"meditative",
		])
		.withMessage("Invalid pose category"),
];

/**
 * Validation Rules: familyParamValidation
 * ----------------------------------------
 * Validates VK family parameter.
 *
 * @example
 * router.get("/family/:family", familyParamValidation, handleValidationErrors, getPosesByVKFamily);
 */
const familyParamValidation = [
	param("family")
		.notEmpty()
		.withMessage("Family is required")
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
		.withMessage("Invalid VK family"),
];

/**
 * Validation Rules: getPosesValidation
 * -----------------------------------
 * Validates query parameters for listing poses.
 *
 * Query Parameters:
 * - category: Optional, valid pose category
 * - difficulty: Optional, one of: beginner, intermediate, advanced
 * - vkFamily: Optional, valid VK family
 * - sidedness: Optional, one of: single_sided, both_sides, symmetrical
 * - drishti: Optional, valid drishti value
 * - page: Optional, positive integer (default: 1)
 * - limit: Optional, integer 1-100 (default: 50)
 * - search: Optional, search query
 *
 * @example
 * router.get("/", getPosesValidation, handleValidationErrors, getPoses);
 */
const getPosesValidation = [
	query("category")
		.optional()
		.isIn([
			"standing_mountain",
			"standing_asymmetric",
			"standing_symmetric",
			"one_leg_balance",
			"seated_forward",
			"seated_twist",
			"seated_hip_opener",
			"supine",
			"prone",
			"inverted",
			"arm_support",
			"backbend",
			"meditative",
		])
		.withMessage("Invalid pose category"),

	query("difficulty")
		.optional()
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be one of: beginner, intermediate, advanced"),

	query("vkFamily")
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
		.withMessage("Invalid VK family"),

	query("sidedness")
		.optional()
		.isIn(["single_sided", "both_sides", "symmetrical"])
		.withMessage("Sidedness must be one of: single_sided, both_sides, symmetrical"),

	query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

	query("limit")
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage("Limit must be between 1 and 100"),

	query("search")
		.optional()
		.trim()
		.isLength({ min: 2 })
		.withMessage("Search query must be at least 2 characters"),
];

/**
 * Validation Rules: searchPosesValidation
 * ----------------------------------------
 * Validates query parameters for searching poses.
 *
 * Query Parameters:
 * - q: Required, search query string (min 2 chars)
 * - difficulty: Optional, difficulty level
 * - category: Optional, pose category
 *
 * @example
 * router.get("/search", searchPosesValidation, handleValidationErrors, searchPoses);
 */
const searchPosesValidation = [
	query("q")
		.notEmpty()
		.withMessage("Search query is required")
		.isLength({ min: 2 })
		.withMessage("Search query must be at least 2 characters"),

	query("difficulty")
		.optional()
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be one of: beginner, intermediate, advanced"),

	query("category")
		.optional()
		.isIn([
			"standing_mountain",
			"standing_asymmetric",
			"standing_symmetric",
			"one_leg_balance",
			"seated_forward",
			"seated_twist",
			"seated_hip_opener",
			"supine",
			"prone",
			"inverted",
			"arm_support",
			"backbend",
			"meditative",
		])
		.withMessage("Invalid pose category"),
];

module.exports = {
	poseIdValidation,
	categoryParamValidation,
	familyParamValidation,
	getPosesValidation,
	searchPosesValidation,
};
