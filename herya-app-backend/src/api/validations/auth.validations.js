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

module.exports = {
	registerValidations,
	loginValidations,
};
