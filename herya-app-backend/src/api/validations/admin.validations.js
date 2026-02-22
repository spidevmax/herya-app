const { query, param, body } = require("express-validator");

/**
 * Validations: Admin Endpoints
 * =============================
 * Input validation rules for admin-exclusive endpoints using express-validator
 */

/**
 * getAllUsersValidation
 * Validates query parameters for retrieving all users with filtering
 * - role: optional filter by user role (user/admin)
 * - search: optional search by name or email
 * - page: pagination page number (default: 1, min: 1)
 * - limit: results per page (default: 20, max: 100)
 */
const getAllUsersValidation = [
	query("role")
		.optional()
		.isIn(["user", "admin"])
		.withMessage("Invalid role. Must be 'user' or 'admin'"),

	query("search")
		.optional()
		.isString()
		.trim()
		.isLength({ min: 1 })
		.withMessage("Search query must not be empty"),

	query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),

	query("limit")
		.optional()
		.isInt({ min: 1, max: 100 })
		.withMessage("Limit must be between 1 and 100"),
];

/**
 * updateUserRoleValidation
 * Validates user ID parameter and role update body
 * - id: MongoDB ObjectId format
 * - role: must be 'user' or 'admin'
 */
const updateUserRoleValidation = [
	param("id").isMongoId().withMessage("Invalid user ID format"),

	body("role")
		.notEmpty()
		.withMessage("Role is required")
		.isIn(["user", "admin"])
		.withMessage("Invalid role. Must be 'user' or 'admin'"),
];

/**
 * userIdParamValidation
 * Validates MongoDB ObjectId for user parameter
 */
const userIdParamValidation = [param("id").isMongoId().withMessage("Invalid user ID format")];

/**
 * createVKSequenceValidation
 * Validates body for creating new VK sequence
 * - name: sequence name (required, non-empty)
 * - description: brief description (optional)
 * - family: VK family name (required)
 * - level: progression level 1-3 (required)
 * - duration: practice duration in minutes (required, positive integer)
 * - structure: sequence poses structure (required, array)
 */
const createVKSequenceValidation = [
	body("name")
		.notEmpty()
		.withMessage("Sequence name is required")
		.isString()
		.withMessage("Name must be a string")
		.isLength({ min: 2, max: 255 })
		.withMessage("Name must be between 2 and 255 characters"),

	body("family").notEmpty().withMessage("Family is required"),

	body("level")
		.notEmpty()
		.withMessage("Level is required")
		.isInt({ min: 1, max: 3 })
		.withMessage("Level must be 1, 2, or 3"),

	body("duration")
		.notEmpty()
		.withMessage("Duration is required")
		.isInt({ min: 1 })
		.withMessage("Duration must be a positive integer"),
];

/**
 * updateVKSequenceValidation
 * Validates sequence ID and body for updating VK sequence
 */
const updateVKSequenceValidation = [
	param("id").isMongoId().withMessage("Invalid sequence ID format"),

	body("name")
		.optional()
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Name must be between 2 and 255 characters"),

	body("level").optional().isInt({ min: 1, max: 3 }).withMessage("Level must be 1, 2, or 3"),

	body("duration").optional().isInt({ min: 1 }).withMessage("Duration must be a positive integer"),
];

/**
 * resourceIdParamValidation
 * Generic validation for MongoDB ObjectId in URL parameter
 */
const resourceIdParamValidation = [
	param("id").isMongoId().withMessage("Invalid resource ID format"),
];

/**
 * createPoseValidation
 * Validates body for creating new pose
 * - name: pose name (required, non-empty)
 * - category: pose category (required)
 * - difficulty: difficulty level (required)
 * - sanskriName: Sanskrit name (optional)
 * - description: pose description (optional)
 */
const createPoseValidation = [
	body("name")
		.notEmpty()
		.withMessage("Pose name is required")
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Name must be between 2 and 255 characters"),

	body("category")
		.notEmpty()
		.withMessage("Category is required")
		.isString()
		.withMessage("Category must be a string"),

	body("difficulty")
		.notEmpty()
		.withMessage("Difficulty is required")
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be beginner, intermediate, or advanced"),
];

/**
 * updatePoseValidation
 * Validates pose ID and optional body for updating pose
 */
const updatePoseValidation = [
	param("id").isMongoId().withMessage("Invalid pose ID format"),

	body("name")
		.optional()
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Name must be between 2 and 255 characters"),

	body("difficulty")
		.optional()
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be beginner, intermediate, or advanced"),
];

/**
 * createBreathingPatternValidation
 * Validates body for creating new breathing pattern
 * - name: pattern name (required, non-empty)
 * - technique: breathing technique (required)
 * - difficulty: difficulty level (required)
 * - duration: recommended duration (optional, positive integer)
 * - description: pattern description (optional)
 */
const createBreathingPatternValidation = [
	body("name")
		.notEmpty()
		.withMessage("Pattern name is required")
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Name must be between 2 and 255 characters"),

	body("technique")
		.notEmpty()
		.withMessage("Technique is required")
		.isIn(["nadishodhana", "kapalabhati", "bhastrika", "ujjayi", "bhramari", "cooling"])
		.withMessage(
			"Invalid technique. Must be one of: nadishodhana, kapalabhati, bhastrika, ujjayi, bhramari, cooling",
		),

	body("difficulty")
		.notEmpty()
		.withMessage("Difficulty is required")
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be beginner, intermediate, or advanced"),

	body("duration").optional().isInt({ min: 1 }).withMessage("Duration must be a positive integer"),
];

/**
 * updateBreathingPatternValidation
 * Validates pattern ID and optional body for updating breathing pattern
 */
const updateBreathingPatternValidation = [
	param("id").isMongoId().withMessage("Invalid pattern ID format"),

	body("name")
		.optional()
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Name must be between 2 and 255 characters"),

	body("technique")
		.optional()
		.isIn(["nadishodhana", "kapalabhati", "bhastrika", "ujjayi", "bhramari", "cooling"])
		.withMessage(
			"Invalid technique. Must be one of: nadishodhana, kapalabhati, bhastrika, ujjayi, bhramari, cooling",
		),

	body("difficulty")
		.optional()
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be beginner, intermediate, or advanced"),
];

/**
 * userIdQueryValidation
 * Validates userId query parameter for user analytics
 */
const userIdQueryValidation = [param("userId").isMongoId().withMessage("Invalid user ID format")];

module.exports = {
	// User validations
	getAllUsersValidation,
	updateUserRoleValidation,
	userIdParamValidation,

	// VK Sequence validations
	createVKSequenceValidation,
	updateVKSequenceValidation,
	resourceIdParamValidation,

	// Pose validations
	createPoseValidation,
	updatePoseValidation,

	// Breathing Pattern validations
	createBreathingPatternValidation,
	updateBreathingPatternValidation,

	// User analytics
	userIdQueryValidation,
};
