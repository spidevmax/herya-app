const { check } = require("express-validator");

/**
 * Validation Rules: registerValidations
 * ----------------------------------------
 * Validates user registration request body.
 * NOTE: Email uniqueness is checked in the controller, not in this middleware.
 *
 * Fields Validated:
 * - name: Required, non-empty string, 2-50 characters
 * - email: Required, valid email format
 * - password: Required, minimum 8 characters
 * - role: Required, must be "user" or "tutor"
 *
 * @example
 * router.post("/register", uploadUserImage.single("profileImage"), registerValidations, handleValidationErrors, registerUser);
 */
const registerValidations = [
	check("name")
		.trim()
		.notEmpty()
		.withMessage("Name is required")
		.isLength({ min: 2, max: 50 })
		.withMessage("Name must be between 2 and 50 characters"),

	check("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.isEmail()
		.withMessage("Please provide a valid email address")
		.normalizeEmail(),

	check("password")
		.notEmpty()
		.withMessage("Password is required")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),

	check("role")
		.notEmpty()
		.withMessage("Role is required")
		.isIn(["user", "tutor"])
		.withMessage("Role must be either 'user' or 'tutor'"),
];

/**
 * Validation Rules: loginValidations
 * -----------------------------------
 * Validates user login request body.
 *
 * Fields Validated:
 * - email: Required, valid email format
 * - password: Required, non-empty
 *
 * @example
 * router.post("/login", loginValidations, handleValidationErrors, loginUser);
 */
const loginValidations = [
	check("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.isEmail()
		.withMessage("Please provide a valid email address")
		.normalizeEmail(),

	check("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordValidations = [
	check("email")
		.trim()
		.notEmpty()
		.withMessage("Email is required")
		.isEmail()
		.withMessage("Please provide a valid email address")
		.normalizeEmail(),

	check("locale").optional().isIn(["es", "en"]).withMessage("Locale must be either 'es' or 'en'"),
];

const resetPasswordValidations = [
	check("token").trim().notEmpty().withMessage("Reset token is required"),

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

module.exports = {
	registerValidations,
	loginValidations,
	forgotPasswordValidations,
	resetPasswordValidations,
};
