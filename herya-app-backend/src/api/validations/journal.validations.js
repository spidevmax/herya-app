const { check } = require("express-validator");

/**
 * Validation Rules: journalValidations
 * -----------------------------------
 * Validates journal entry request body.
 *
 * Fields Validated:
 * - energyLevel.before: Required, integer 1-10 (energy level before practice)
 * - energyLevel.after: Required, integer 1-10 (energy level after practice)
 * - stressLevel.before: Required, integer 1-10 (stress level before practice)
 * - stressLevel.after: Required, integer 1-10 (stress level after practice)
 * - moodBefore: Optional, array of mood descriptions before practice
 * - moodAfter: Optional, array of mood descriptions after practice
 *
 * @example
 * router.post("/", journalValidations, handleValidationErrors, createJournalEntry);
 */
const journalValidations = [
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

	check("moodBefore")
		.optional()
		.isArray()
		.withMessage("Mood before must be an array"),

	check("moodAfter")
		.optional()
		.isArray()
		.withMessage("Mood after must be an array"),
];

module.exports = {
	journalValidations,
};
