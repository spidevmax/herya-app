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

	check("moodBefore.*")
		.isIn([
			"calm",
			"anxious",
			"energized",
			"tired",
			"focused",
			"stressed",
			"happy",
			"sad",
			"grounded",
			"restless",
			"peaceful",
			"overwhelmed",
			"motivated",
			"discouraged",
			"scattered",
			"irritated",
		])
		.withMessage("Invalid mood value in moodBefore"),

	check("moodAfter")
		.notEmpty()
		.withMessage("At least one mood after practice is required")
		.isArray({ min: 1 })
		.withMessage("moodAfter must be a non-empty array"),

	check("moodAfter.*")
		.isIn([
			"calm",
			"anxious",
			"energized",
			"tired",
			"focused",
			"stressed",
			"happy",
			"sad",
			"grounded",
			"restless",
			"peaceful",
			"overwhelmed",
			"motivated",
			"discouraged",
			"renewed",
			"centered",
			"light",
			"clear",
			"scattered",
			"irritated",
		])
		.withMessage("Invalid mood value in moodAfter"),

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

	check("difficultyFeedback")
		.optional()
		.isIn(["too_easy", "just_right", "too_hard"])
		.withMessage(
			'difficultyFeedback must be one of: "too_easy", "just_right", "too_hard"',
		),

	check("pacingFeedback")
		.optional()
		.isIn(["too_slow", "perfect", "too_fast"])
		.withMessage(
			'pacingFeedback must be one of: "too_slow", "perfect", "too_fast"',
		),
];

/**
 * Validation Rules: journalIdValidation
 * -------------------------------------
 * Validates the journal entry ID URL parameter.
 *
 * Applied to: GET /:id, PUT /:id, DELETE /:id
 *
 * @example
 * router.get("/:id", journalIdValidation, handleValidationErrors, getJournalEntryById);
 */
const journalIdValidation = [
	check("id")
		.notEmpty()
		.withMessage("Journal entry ID is required")
		.isMongoId()
		.withMessage("Journal entry ID must be a valid MongoDB ID"),
];

/**
 * Validation Rules: getJournalEntriesValidation
 * ----------------------------------------------
 * Validates optional query parameters for listing journal entries.
 *
 * Fields Validated:
 * - page: Optional, positive integer
 * - limit: Optional, integer 1-100
 * - startDate: Optional, valid ISO 8601 date
 * - endDate: Optional, valid ISO 8601 date
 * - sequenceFamily: Optional, non-empty string
 * - sortBy: Optional, one of: "date", "mood", "energy"
 *
 * Applied to: GET /api/v1/journal-entries
 *
 * @example
 * router.get("/", getJournalEntriesValidation, handleValidationErrors, getJournalEntries);
 */
const getJournalEntriesValidation = [
	check("page")
		.optional()
		.isInt({ min: 1 })
		.withMessage("Page must be a positive integer"),

	check("limit")
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage("Limit must be between 1 and 100"),

	check("startDate")
		.optional()
		.isISO8601()
		.withMessage("Start date must be a valid ISO 8601 date"),

	check("endDate")
		.optional()
		.isISO8601()
		.withMessage("End date must be a valid ISO 8601 date"),

	check("sequenceFamily")
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
		.withMessage("Invalid VK family for sequenceFamily filter"),

	check("sortBy")
		.optional()
		.isIn(["date", "mood", "energy"])
		.withMessage('Sort by must be one of: "date", "mood", "energy"'),
];

module.exports = {
	journalValidations,
	journalIdValidation,
	getJournalEntriesValidation,
};
