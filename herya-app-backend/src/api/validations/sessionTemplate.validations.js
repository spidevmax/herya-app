const { check } = require("express-validator");

const templateIdValidation = [
	check("id")
		.notEmpty()
		.withMessage("Template ID is required")
		.isMongoId()
		.withMessage("Template ID must be a valid MongoDB ID"),
];

const createTemplateValidations = [
	check("name")
		.notEmpty()
		.withMessage("Template name is required")
		.isLength({ max: 80 })
		.withMessage("Name must be 80 characters or less"),

	check("sessionType")
		.notEmpty()
		.withMessage("Session type is required")
		.isIn(["vk_sequence", "pranayama", "meditation", "complete_practice"])
		.withMessage("Invalid session type"),

	check("blocks")
		.isArray({ min: 1 })
		.withMessage("At least one block is required"),

	check("blocks.*.blockType")
		.notEmpty()
		.withMessage("Block type is required")
		.isIn(["vk_sequence", "pranayama", "meditation"])
		.withMessage("Invalid block type"),

	check("blocks.*.label")
		.notEmpty()
		.withMessage("Block label is required"),

	check("blocks.*.durationMinutes")
		.notEmpty()
		.withMessage("Block duration is required")
		.isInt({ min: 1 })
		.withMessage("Block duration must be at least 1 minute"),

	check("blocks.*.order")
		.notEmpty()
		.withMessage("Block order is required")
		.isInt({ min: 0 })
		.withMessage("Block order must be a non-negative integer"),

	check("totalMinutes")
		.notEmpty()
		.withMessage("Total minutes is required")
		.isInt({ min: 1 })
		.withMessage("Total minutes must be at least 1"),

	check("preset")
		.optional()
		.isIn(["adult", "tutor"])
		.withMessage("Preset must be adult or tutor"),

	check("childProfile")
		.optional()
		.isMongoId()
		.withMessage("Child profile must be a valid MongoDB ID"),
];

const updateTemplateValidations = [
	...templateIdValidation,
	check("name")
		.optional()
		.isLength({ min: 1, max: 80 })
		.withMessage("Name must be between 1 and 80 characters"),

	check("sessionType")
		.optional()
		.isIn(["vk_sequence", "pranayama", "meditation", "complete_practice"])
		.withMessage("Invalid session type"),

	check("blocks")
		.optional()
		.isArray({ min: 1 })
		.withMessage("At least one block is required"),

	check("totalMinutes")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Total minutes must be at least 1"),

	check("preset")
		.optional()
		.isIn(["adult", "tutor"])
		.withMessage("Preset must be adult or tutor"),
];

module.exports = {
	templateIdValidation,
	createTemplateValidations,
	updateTemplateValidations,
};
