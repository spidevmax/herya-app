const { check } = require("express-validator");

const childProfileIdValidation = [
	check("id")
		.notEmpty()
		.withMessage("Child profile ID is required")
		.isMongoId()
		.withMessage("Child profile ID must be a valid MongoDB ID"),
];

const createChildProfileValidations = [
	check("name")
		.notEmpty()
		.withMessage("Child name is required")
		.isLength({ max: 60 })
		.withMessage("Name must be 60 characters or less"),

	check("age").optional().isInt({ min: 3, max: 18 }).withMessage("Age must be between 3 and 18"),

	check("avatarColor")
		.optional()
		.matches(/^#[0-9a-fA-F]{6}$/)
		.withMessage("Avatar color must be a valid hex color (e.g. #7C6FD4)"),

	check("safetyAnchors.phrase")
		.optional()
		.isLength({ max: 120 })
		.withMessage("Safety anchor phrase must be 120 characters or less"),

	check("safetyAnchors.bodyCue")
		.optional()
		.isLength({ max: 120 })
		.withMessage("Safety anchor body cue must be 120 characters or less"),

	check("knownTriggers").optional().isArray().withMessage("knownTriggers must be an array"),

	check("knownTriggers.*")
		.optional()
		.isLength({ max: 200 })
		.withMessage("Each trigger must be 200 characters or less"),

	check("contraindications").optional().isArray().withMessage("contraindications must be an array"),

	check("contraindications.*")
		.optional()
		.isLength({ max: 200 })
		.withMessage("Each contraindication must be 200 characters or less"),

	check("notes")
		.optional()
		.isLength({ max: 2000 })
		.withMessage("Notes must be 2000 characters or less"),
];

const updateChildProfileValidations = [
	...childProfileIdValidation,
	check("name")
		.optional()
		.isLength({ min: 1, max: 60 })
		.withMessage("Name must be between 1 and 60 characters"),

	check("age").optional().isInt({ min: 3, max: 18 }).withMessage("Age must be between 3 and 18"),

	check("avatarColor")
		.optional()
		.matches(/^#[0-9a-fA-F]{6}$/)
		.withMessage("Avatar color must be a valid hex color"),

	check("safetyAnchors.phrase")
		.optional()
		.isLength({ max: 120 })
		.withMessage("Safety anchor phrase must be 120 characters or less"),

	check("safetyAnchors.bodyCue")
		.optional()
		.isLength({ max: 120 })
		.withMessage("Safety anchor body cue must be 120 characters or less"),

	check("active").optional().isBoolean().withMessage("active must be a boolean"),
];

module.exports = {
	childProfileIdValidation,
	createChildProfileValidations,
	updateChildProfileValidations,
};
