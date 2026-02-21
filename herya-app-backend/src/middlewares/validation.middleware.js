const { validationResult } = require("express-validator");
const { deleteImgCloudinary } = require("../utils/deleteImage");

/**
 * Middleware: handleValidationErrors
 * --------------------------------
 * Catches and formats validation errors from express-validator.
 *
 * Functionality:
 * 1. Collects all validation errors from request
 * 2. If upload middleware already executed, deletes uploaded image from Cloudinary to avoid orphaned files
 * 3. Maps errors to user-friendly format
 * 4. Returns 400 with structured error response if any validation fails
 * 5. Allows request to proceed if validation passes
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
 * router.post("/register", uploadUserImage.single("profileImage"), registerValidations, handleValidationErrors, registerUser);
 * router.post("/login", loginValidations, handleValidationErrors, loginUser);
 */
const handleValidationErrors = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		// If image was uploaded but validation failed, delete it from Cloudinary
		if (req.file?.filename) {
			try {
				await deleteImgCloudinary(req.file.filename);
			} catch (deleteError) {
				console.error("Error deleting image from Cloudinary:", deleteError);
				// Continue even if deletion fails, still send validation error to client
			}
		}

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

module.exports = {
	handleValidationErrors,
};
