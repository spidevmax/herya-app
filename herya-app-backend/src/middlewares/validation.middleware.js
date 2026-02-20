const { validationResult, check } = require("express-validator");

/**
 * Middleware: handleValidationErrors
 * --------------------------------
 * Catches and formats validation errors from express-validator.
 *
 * Functionality:
 * 1. Collects all validation errors from request
 * 2. Maps errors to user-friendly format
 * 3. Returns 400 with structured error response if any validation fails
 * 4. Allows request to proceed if validation passes
 *
 * Error Response Format:
 * {
 *   success: false,
 *   message: "Validation error",
 *   errors: [
 *     { field: "email", message: "Invalid email format" },
 *     { field: "password", message: "Password too short" }
 *   ]
 * }
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post("/register", registerValidations, handleValidationErrors, registerUser);
 */
const handleValidationErrors = (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(400).json({
			success: false,
			message: "Validation error",
			errors: errors.array().map((error) => ({
				field: error.param || error.entity,
				message: error.msg,
			})),
		});
	}

	next();
};

/**
 * Auth Validations
 * ----------------
 * Validation chain for user registration
 */
const registerValidations = [
	check("name")
		.trim()
		.notEmpty()
		.withMessage("Name is required")
		.isLength({ min: 2 })
		.withMessage("Name must be at least 2 characters"),

	check("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.isEmail()
		.withMessage("Invalid email format")
		.normalizeEmail(),

	check("password")
		.notEmpty()
		.withMessage("Password is required")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters")
		.matches(/[A-Z]/)
		.withMessage("Password must contain at least one uppercase letter")
		.matches(/[0-9]/)
		.withMessage("Password must contain at least one number"),
];

/**
 * Validation chain for user login
 */
const loginValidations = [
	check("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.isEmail()
		.withMessage("Invalid email format")
		.normalizeEmail(),

	check("password")
		.notEmpty()
		.withMessage("Password is required")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters"),
];

/**
 * User Profile Update Validations
 */
const updateProfileValidations = [
	check("name")
		.optional()
		.trim()
		.isLength({ min: 2 })
		.withMessage("Name must be at least 2 characters"),

	check("email")
		.optional()
		.trim()
		.isEmail()
		.withMessage("Invalid email format")
		.normalizeEmail(),
];

/**
 * Change Password Validations
 */
const changePasswordValidations = [
	check("currentPassword")
		.notEmpty()
		.withMessage("Current password is required")
		.isLength({ min: 8 })
		.withMessage("Password too short"),

	check("newPassword")
		.notEmpty()
		.withMessage("New password is required")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters")
		.matches(/[A-Z]/)
		.withMessage("Password must contain at least one uppercase letter")
		.matches(/[0-9]/)
		.withMessage("Password must contain at least one number"),

	check("confirmPassword")
		.notEmpty()
		.withMessage("Password confirmation is required")
		.custom((value, { req }) => {
			if (value !== req.body.newPassword) {
				throw new Error("Passwords do not match");
			}
			return true;
		}),
];

/**
 * Journal Entry Validations
 */
const journalValidations = [
	check("energyLevel.before")
		.notEmpty()
		.withMessage("Before energy level is required")
		.isInt({ min: 1, max: 10 })
		.withMessage("Energy level must be between 1 and 10"),

	check("energyLevel.after")
		.notEmpty()
		.withMessage("After energy level is required")
		.isInt({ min: 1, max: 10 })
		.withMessage("Energy level must be between 1 and 10"),

	check("stressLevel.before")
		.notEmpty()
		.withMessage("Before stress level is required")
		.isInt({ min: 1, max: 10 })
		.withMessage("Stress level must be between 1 and 10"),

	check("stressLevel.after")
		.notEmpty()
		.withMessage("After stress level is required")
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
	handleValidationErrors,
	registerValidations,
	loginValidations,
	updateProfileValidations,
	changePasswordValidations,
	journalValidations,
};
