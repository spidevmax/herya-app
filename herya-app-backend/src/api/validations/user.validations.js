const { check } = require("express-validator");

/**
 * Validation Rules: updateProfileValidations
 * -------------------------------------------
 * Validates user profile update request body.
 *
 * Fields Validated:
 * - name: Optional, 2-50 characters if provided
 * - email: Optional, valid email format if provided
 *
 * @example
 * router.put("/me", updateProfileValidations, handleValidationErrors, updateMyProfile);
 */
const updateProfileValidations = [
	check("name")
		.optional()
		.trim()
		.isLength({ min: 2, max: 50 })
		.withMessage("Name must be between 2 and 50 characters"),

	check("email")
		.optional()
		.trim()
		.isEmail()
		.withMessage("Please provide a valid email address")
		.normalizeEmail(),
];

/**
 * Validation Rules: changePasswordValidations
 * ------------------------------------
 * Validates password change request body.
 *
 * Fields Validated:
 * - currentPassword: Required, non-empty
 * - newPassword: Required, minimum 8 characters
 * - confirmPassword: Required, must match newPassword
 *
 * @example
 * router.put("/change-password", changePasswordValidations, handleValidationErrors, changeMyPassword);
 */
const changePasswordValidations = [
	check("currentPassword")
		.notEmpty()
		.withMessage("Current password is required"),

	check("newPassword")
		.notEmpty()
		.withMessage("New password is required")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters long"),

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
	updateProfileValidations,
	changePasswordValidations,
};
