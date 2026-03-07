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
const userIdParamValidation = [
	param("id").isMongoId().withMessage("Invalid user ID format"),
];

/**
 * createVKSequenceValidation
 * Validates body for creating new VK sequence
 * - sanskritName: Sanskrit name (required)
 * - englishName: English name (required)
 * - family: VK family name (required)
 * - level: progression level 1-3 (required)
 */
const createVKSequenceValidation = [
	body("sanskritName")
		.notEmpty()
		.withMessage("Sanskrit name is required")
		.isString()
		.withMessage("Sanskrit name must be a string")
		.isLength({ min: 2, max: 255 })
		.withMessage("Sanskrit name must be between 2 and 255 characters"),

	body("englishName")
		.notEmpty()
		.withMessage("English name is required")
		.isString()
		.withMessage("English name must be a string")
		.isLength({ min: 2, max: 255 })
		.withMessage("English name must be between 2 and 255 characters"),

	body("family").notEmpty().withMessage("Family is required"),

	body("level")
		.notEmpty()
		.withMessage("Level is required")
		.isInt({ min: 1, max: 3 })
		.withMessage("Level must be 1, 2, or 3"),
];

/**
 * updateVKSequenceValidation
 * Validates sequence ID and body for updating VK sequence
 */
const updateVKSequenceValidation = [
	param("id").isMongoId().withMessage("Invalid sequence ID format"),

	body("sanskritName")
		.optional()
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Sanskrit name must be between 2 and 255 characters"),

	body("englishName")
		.optional()
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("English name must be between 2 and 255 characters"),

	body("level")
		.optional()
		.isInt({ min: 1, max: 3 })
		.withMessage("Level must be 1, 2, or 3"),
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
 * - name: English pose name (required)
 * - romanizationName: romanized Sanskrit name (required)
 * - iastName: IAST transliteration (required)
 * - sanskritName: Sanskrit script name (required)
 * - vkCategory.primary: VK pose category (required)
 * - difficulty: difficulty level (required)
 */
const createPoseValidation = [
	body("name")
		.notEmpty()
		.withMessage("Pose name is required")
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Name must be between 2 and 255 characters"),

	body("romanizationName")
		.notEmpty()
		.withMessage("Romanization name is required")
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Romanization name must be between 2 and 255 characters"),

	body("iastName")
		.notEmpty()
		.withMessage("IAST name is required")
		.isString()
		.withMessage("IAST name must be a string"),

	body("sanskritName")
		.notEmpty()
		.withMessage("Sanskrit name is required")
		.isString()
		.withMessage("Sanskrit name must be a string"),

	body("vkCategory.primary")
		.notEmpty()
		.withMessage("Pose category is required")
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

	body("romanizationName")
		.optional()
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Romanization name must be between 2 and 255 characters"),

	body("difficulty")
		.optional()
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be beginner, intermediate, or advanced"),
];

/**
 * createBreathingPatternValidation
 * Validates body for creating new breathing pattern
 * - romanizationName: romanized Sanskrit name (required, unique)
 * - iastName: IAST transliteration (required)
 * - sanskritName: Sanskrit script name (required)
 * - description: pattern description (required)
 * - difficulty: difficulty level (required)
 */
const createBreathingPatternValidation = [
	body("romanizationName")
		.notEmpty()
		.withMessage("Romanization name is required")
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Romanization name must be between 2 and 255 characters"),

	body("iastName")
		.notEmpty()
		.withMessage("IAST name is required")
		.isString()
		.withMessage("IAST name must be a string"),

	body("sanskritName")
		.notEmpty()
		.withMessage("Sanskrit name is required")
		.isString()
		.withMessage("Sanskrit name must be a string"),

	body("description")
		.notEmpty()
		.withMessage("Description is required")
		.isString()
		.withMessage("Description must be a string"),

	body("difficulty")
		.notEmpty()
		.withMessage("Difficulty is required")
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be beginner, intermediate, or advanced"),
];

/**
 * updateBreathingPatternValidation
 * Validates pattern ID and optional body for updating breathing pattern
 */
const updateBreathingPatternValidation = [
	param("id").isMongoId().withMessage("Invalid pattern ID format"),

	body("romanizationName")
		.optional()
		.isString()
		.isLength({ min: 2, max: 255 })
		.withMessage("Romanization name must be between 2 and 255 characters"),

	body("difficulty")
		.optional()
		.isIn(["beginner", "intermediate", "advanced"])
		.withMessage("Difficulty must be beginner, intermediate, or advanced"),
];

/**
 * analyticsUserIdValidation
 * Validates userId URL parameter for user analytics endpoint
 */
const analyticsUserIdValidation = [
	param("userId").isMongoId().withMessage("Invalid user ID format"),
];

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
	analyticsUserIdValidation,
};
