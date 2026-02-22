const { check } = require("express-validator");

/**
 * Validation Rules: journalValidations (POST - Create)
 * ---------------------------------------------------
 * Validates journal entry creation request body.
 *
 * Fields Validated:
 * - session: Required, valid ObjectId
 * - moodBefore: Required, non-empty array (1+ moods min)
 * - moodAfter: Required, non-empty array (1+ moods min)
 * - energyLevel.before: Required, integer 1-10
 * - energyLevel.after: Required, integer 1-10
 * - stressLevel.before: Required, integer 1-10
 * - stressLevel.after: Required, integer 1-10
 *
 * Applied to: POST /api/v1/journal-entries
 *
 * @example
 * router.post("/", journalValidations, handleValidationErrors, createJournalEntry);
 */
const journalValidations = [
	check("session")
		.notEmpty()
		.withMessage("Session ID is required")
		.isMongoId()
		.withMessage("Session ID must be a valid MongoDB ID"),

	check("moodBefore")
		.notEmpty()
		.withMessage("At least one mood before practice is required")
		.isArray({ min: 1 })
		.withMessage("moodBefore must be a non-empty array"),

	check("moodAfter")
		.notEmpty()
		.withMessage("At least one mood after practice is required")
		.isArray({ min: 1 })
		.withMessage("moodAfter must be a non-empty array"),

	check("energyLevel.before")
		.notEmpty()
		.withMessage("Energy level before practice is required")
		.isInt({ min: 1, max: 10 })
		.withMessage("Energy level must be between 1 and 10"),

	check("energyLevel.after")
		.notEmpty()
		.withMessage("Energy level after practice is required")
		.isInt({ min: 1, max: 10 })
		.withMessage("Energy level must be between 1 and 10"),

	check("stressLevel.before")
		.notEmpty()
		.withMessage("Stress level before practice is required")
		.isInt({ min: 1, max: 10 })
		.withMessage("Stress level must be between 1 and 10"),

	check("stressLevel.after")
		.notEmpty()
		.withMessage("Stress level after practice is required")
		.isInt({ min: 1, max: 10 })
		.withMessage("Stress level must be between 1 and 10"),
];

module.exports = {
	journalValidations,
};
