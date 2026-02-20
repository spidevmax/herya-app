const multer = require("multer");
const { cloudinary } = require("../../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/**
 * Multer Storage Configuration for User Profile Images
 * ---------------------------------------------------
 * Configures Cloudinary storage for user profile image uploads.
 *
 * Features:
 * - Stores images in Cloudinary cloud (not local disk)
 * - Organizes uploads in "herya-app/users" folder
 * - Supports multiple image formats (jpg, png, jpeg, gif, webp)
 * - Automatically generates public_id for image management
 * - Returns URL and public_id in req.file
 *
 * Storage Details:
 * - Folder: "herya-app/users"
 * - Allowed formats: jpg, png, jpeg, gif, webp
 * - Max size limit: 5MB (configured in upload middleware)
 *
 * Usage:
 * - req.file.path → Cloudinary image URL
 * - req.file.filename → Cloudinary public_id (for deletion)
 */
const userImageStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "herya-app/users",
		allowedFormats: ["jpg", "png", "jpeg", "gif", "webp"],
	},
});

/**
 * Multer Configuration for User Images
 * -----------------------------------
 * Handles user profile image uploads with size limits and validation.
 *
 * Configuration:
 * - Storage: Cloudinary (defined above)
 * - File size limit: 5MB
 * - File count: Single file per request
 *
 * Usage in Routes:
 * router.post("/register", uploadUserImage.single("profileImage"), controller);
 * router.put("/profile", uploadUserImage.single("profileImage"), controller);
 *
 * Middleware Details:
 * - Extracts file from form field named "profileImage"
 * - Validates file size (max 5MB)
 * - Returns req.file with: path (URL), filename (public_id), originalname, size, mimetype
 */
const uploadUserImage = multer({
	storage: userImageStorage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB
	},
	fileFilter: (file, cb) => {
		// Validate MIME type
		const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type. Only jpg, png, gif, webp allowed"));
		}
	},
});

/**
 * Error Handler for Upload Middleware
 * ---------------------------------
 * Handles multer errors gracefully.
 *
 * Common Errors:
 * - LIMIT_FILE_SIZE: File exceeds 5MB
 * - LIMIT_FILE_COUNT: Too many files uploaded
 * - MIMETYPE: Invalid file type
 *
 * Usage:
 * app.use((err, req, res, next) => {
 *   if (err instanceof multer.MulterError) {
 *     return res.status(400).json({
 *       success: false,
 *       message: uploadErrorHandler(err.code)
 *     });
 *   }
 *   next(err);
 * });
 */
const uploadErrorHandler = (code) => {
	const errorMessages = {
		LIMIT_FILE_SIZE: "File size too large. Maximum 5MB allowed.",
		LIMIT_FILE_COUNT: "Too many files. Only 1 file allowed.",
		LIMIT_FIELD_KEY: "Field name too long.",
		LIMIT_FIELD_VALUE: "Field value too long.",
		LIMIT_FIELD_COUNT: "Too many fields.",
		LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
	};

	return errorMessages[code] || "File upload failed.";
};

module.exports = {
	uploadUserImage,
	uploadErrorHandler,
};
