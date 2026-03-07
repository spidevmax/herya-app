const { validationResult } = require("express-validator");
const { deleteImgCloudinary } = require("../utils/deleteImage");

/**
 * Middleware: handleValidationErrors
 * --------------------------------
 * Catches and formats validation errors from express-validator middleware chains.
 *
 * Validation Processing Flow:
 * 1. express-validator middleware chain runs on request (checks body, query, params)
 * 2. Any validation failures are collected in validationResult
 * 3. handleValidationErrors checks if errors exist
 * 4. If validation fails:
 *    a. If file was uploaded to Cloudinary, delete it (cleanup orphaned uploads)
 *    b. Format errors into user-friendly structure
 *    c. Return 400 response with error details
 * 5. If validation passes, call next() to proceed to controller
 *
 * Clean-up Behavior:
 * - If validations fail AFTER file upload, deletes uploaded file from Cloudinary
 * - Prevents orphaned media when validation catches bad data
 * - Common scenario: User register with bad email but good photo → photo deleted
 * - Error deletion is graceful - even if cleanup fails, validation error is sent
 * - Logs cleanup errors but doesn't block validation response
 *
 * Error Response Format:
 * ```json
 * {
 *   "success": false,
 *   "message": "Validation error",
 *   "errors": [
 *     { "field": "email", "message": "Invalid email format" },
 *     { "field": "password", "message": "Password too short" }
 *   ]
 * }
 * ```
 *
 * Field Mapping:
 * - Uses error.path for field errors (body, query, param fields) — express-validator v7+
 * - Uses error.type as fallback for non-field errors (e.g. 'alternative', 'unknown_fields')
 * - Maps to user-friendly field names for client
 *
 * Error Types Handled:
 * - Body validation: registerValidations, loginValidations, updateValidations
 * - Query param validation: searchValidations, filterValidations
 * - URL param validation: idParamValidation, slugValidation
 * - File validation: MIME type, size (via multer fileFilter)
 * - Custom validation: Custom rule validators
 *
 * Usage Pattern:
 * - Always place AFTER validation chains in middleware order
 * - Typically before controllers that need clean data
 * - Works with express-validator chains: body(), query(), param()
 *
 * @returns {Function} Express middleware function
 *
 * Request Properties Used:
 * - req.file?.filename - Cloudinary public_id if single file uploaded
 * - req.files - array (.array()) or object of arrays (.fields()) for multi-file uploads
 * - validationResult(req) - express-validator result object
 *
 * HTTP Status:
 * - Returns 400 Bad Request if validation fails
 * - Calls next() if validation passes
 *
 * @example
 * // Single file upload with validations
 * router.post(
 *   "/register",
 *   uploadUserImage.single("profileImage"),
 *   registerValidations,               // Validation chain from express-validator
 *   handleValidationErrors,             // Error handler
 *   asyncErrorWrapper(registerUser)     // Controller
 * );
 *
 * @example
 * // Journal entry with multiple files and validations
 * router.post(
 *   "/journal/:id",
 *   uploadJournalMixed.fields([...]),   // Upload (optional file)
 *   journalValidations,                 // Validation chain
 *   handleValidationErrors,             // Cleanup + error handling
 *   asyncErrorWrapper(createJournal)    // Controller
 * );
 *
 * @example
 * // No file, just data validation
 * router.post(
 *   "/login",
 *   loginValidations,                  // Validation chain (no files)
 *   handleValidationErrors,            // Error handling (no cleanup needed)
 *   asyncErrorWrapper(loginUser)       // Controller
 * );
 *
 * Integration with Validations:
 * - Works with all validation chains from validations/*.js files
 * - Handles both single file uploads and multiple/mixed uploads
 * - Field names from multer: "profileImage", "photos", "voiceNotes", "videos", etc.
 *
 * Clean-up Error Scenarios:
 * - Cloudinary service down → Logs error, still sends validation error to client
 * - Invalid public_id → Logs error, still sends validation error to client
 * - Network timeout → Logs error, still sends validation error to client
 * - Goal: Never block client response due to cleanup failure
 *
 * Middleware Order (Critical):
 * 1. Upload middleware (multer) - uploads file to Cloudinary
 * 2. Validation middleware (expressed-validator) - validates request data
 * 3. handleValidationErrors - checks for errors and cleanup
 * 4. Controller - processes valid request
 *
 * Why File Cleanup is Needed:
 * - File uploaded to cloud storage before validation runs
 * - If validation fails, file is orphaned unless explicitly deleted
 * - Would accumulate unused files in Cloudinary over time
 * - Cleanup ensures only valid requests have associated files
 */
const handleValidationErrors = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		// Collect all Cloudinary public_ids from any uploaded files and delete them
		const publicIds = [];

		// Single-file upload (.single())
		if (req.file?.filename) {
			publicIds.push(req.file.filename);
		}

		// Multiple-file upload (.array() → array, or .fields() → object of arrays)
		if (req.files) {
			if (Array.isArray(req.files)) {
				// .array() — req.files is a flat array
				for (const f of req.files) {
					if (f.filename) publicIds.push(f.filename);
				}
			} else {
				// .fields() — req.files is { fieldName: [file, ...], ... }
				for (const fileArr of Object.values(req.files)) {
					for (const f of fileArr) {
						if (f.filename) publicIds.push(f.filename);
					}
				}
			}
		}

		for (const publicId of publicIds) {
			try {
				await deleteImgCloudinary(publicId);
			} catch (deleteError) {
				console.error("Error deleting file from Cloudinary:", deleteError);
				// Continue even if deletion fails, still send validation error to client
			}
		}

		return res.status(400).json({
			success: false,
			message: "Validation error",
			errors: errors.array().map((error) => ({
				field: error.path || error.type,
				message: error.msg,
			})),
		});
	}

	next();
};

module.exports = {
	handleValidationErrors,
};
