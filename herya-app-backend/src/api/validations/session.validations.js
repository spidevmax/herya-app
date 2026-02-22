const { check } = require("express-validator");

/**
 * Validation Rules: createSessionValidations
 * ------------------------------------------
 * Validates session creation request body.
 *
 * Fields Validated:
 * - sessionType: Required, one of: "vk_sequence", "pranayama", "meditation", "complete_practice"
 * - vkSequence: Required if sessionType is "vk_sequence", must be valid MongoDB ObjectId
 * - completePractice: Required if sessionType is "complete_practice", must be object
 * - duration: Required, must be positive integer (minutes)
 * - completed: Optional, must be boolean
 *
 * Conditional Validations:
 * - If sessionType === "vk_sequence", vkSequence must be provided (checked in controller)
 * - If sessionType === "complete_practice", completePractice must be provided (checked in controller)
 *
 * @example
 * router.post("/", createSessionValidations, handleValidationErrors, createSession);
 */
const createSessionValidations = [
	check("sessionType")
		.notEmpty()
		.withMessage("Session type is required")
		.isIn(["vk_sequence", "pranayama", "meditation", "complete_practice"])
		.withMessage(
			'Session type must be one of: "vk_sequence", "pranayama", "meditation", "complete_practice"',
		),

	check("duration")
		.notEmpty()
		.withMessage("Duration is required")
		.isInt({ min: 1 })
		.withMessage("Duration must be a positive integer (minutes)"),

	check("completed").optional().isBoolean().withMessage("Completed must be a boolean value"),
];

/**
 * Validation Rules: updateSessionValidations
 * ------------------------------------------
 * Validates session update request body.
 *
 * Updatable Fields:
 * - completed: Optional, must be boolean
 * - duration: Optional, must be positive integer (minutes)
 * - actualPractice: Optional, object with flex structure
 * - vkFeedback: Optional, object with flex structure
 * - notes: Optional, string (max 1000 chars)
 *
 * @example
 * router.put("/:id", updateSessionValidations, handleValidationErrors, updateSession);
 */
const updateSessionValidations = [
	check("completed").optional().isBoolean().withMessage("Completed must be a boolean value"),

	check("duration")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Duration must be a positive integer (minutes)"),

	check("notes")
		.optional()
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Notes cannot exceed 1000 characters"),
];

/**
 * Validation Rules: sessionIdValidation
 * ------------------------------------
 * Validates session ID parameter.
 *
 * @example
 * router.get("/:id", sessionIdValidation, handleValidationErrors, getSessionById);
 */
const sessionIdValidation = [
	check("id")
		.notEmpty()
		.withMessage("Session ID is required")
		.isMongoId()
		.withMessage("Session ID must be a valid MongoDB ID"),
];

/**
 * Validation Rules: sessionPaginationValidation
 * -------------------------------------------
 * Validates pagination query parameters.
 *
 * @example
 * router.get("/", sessionPaginationValidation, handleValidationErrors, getUserSessions);
 */
const sessionPaginationValidation = [
	check("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

	check("limit")
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage("Limit must be between 1 and 100"),

	check("sessionType")
		.optional()
		.isIn(["vk_sequence", "pranayama", "meditation", "complete_practice"])
		.withMessage(
			'Session type must be one of: "vk_sequence", "pranayama", "meditation", "complete_practice"',
		),

	check("completed").optional().isBoolean().withMessage("Completed must be a boolean value"),

	check("startDate").optional().isISO8601().withMessage("Start date must be a valid ISO 8601 date"),

	check("endDate").optional().isISO8601().withMessage("End date must be a valid ISO 8601 date"),
];

module.exports = {
	createSessionValidations,
	updateSessionValidations,
	sessionIdValidation,
	sessionPaginationValidation,
};
