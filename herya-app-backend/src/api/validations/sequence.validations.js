const { check, query } = require("express-validator");

/**
 * Validation Rules: sequenceIdValidation
 * ------------------------------------
 * Validates sequence ID parameter.
 *
 * @example
 * router.get("/:id", sequenceIdValidation, handleValidationErrors, getSequenceById);
 */
const sequenceIdValidation = [
	check("id")
		.notEmpty()
		.withMessage("Sequence ID is required")
		.isMongoId()
		.withMessage("Sequence ID must be a valid MongoDB ID"),
];

/**
 * Validation Rules: familyIdValidation
 * -----------------------------------
 * Validates VK family parameter.
 *
 * @example
 * router.get("/family/:family", familyIdValidation, handleValidationErrors, getSequencesByFamily);
 */
const familyIdValidation = [
	check("family")
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
 * Validation Rules: getSequencesValidation
 * ----------------------------------------
 * Validates query parameters for listing sequences.
 *
 * Query Parameters:
 * - page: Optional, positive integer (default: 1)
 * - limit: Optional, integer 1-100 (default: 20)
 * - family: Optional, valid VK family
 * - level: Optional, integer 1-3
 * - difficulty: Optional, one of: beginner, intermediate, advanced
 * - unlocked: Optional, boolean string
 *
 * @example
 * router.get("/", getSequencesValidation, handleValidationErrors, getSequences);
 */
const getSequencesValidation = [
	query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

	query("limit")
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage("Limit must be between 1 and 100"),

	query("family")
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

	query("level").optional().isInt({ min: 1, max: 3 }).withMessage("Level must be between 1 and 3"),

	query("difficulty")
		.optional()
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be one of: beginner, intermediate, advanced"),

	query("unlocked").optional().isBoolean().withMessage("Unlocked must be a boolean"),
];

/**
 * Validation Rules: searchSequencesValidation
 * ------------------------------------------
 * Validates query parameters for searching sequences.
 *
 * Query Parameters:
 * - q: Required, search query string (min 2 chars)
 * - family: Optional, valid VK family
 * - difficulty: Optional, difficulty level
 *
 * @example
 * router.get("/search", searchSequencesValidation, handleValidationErrors, searchSequences);
 */
const searchSequencesValidation = [
	query("q")
		.notEmpty()
		.withMessage("Search query is required")
		.isLength({ min: 2 })
		.withMessage("Search query must be at least 2 characters"),

	query("family")
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

	query("difficulty")
		.optional()
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be one of: beginner, intermediate, advanced"),
];

module.exports = {
	sequenceIdValidation,
	familyIdValidation,
	getSequencesValidation,
	searchSequencesValidation,
};
