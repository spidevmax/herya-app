const multer = require("multer");
const { cloudinary } = require("../../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/**
 * Multer Storage Configuration for User Profile Images
 * =====================================================
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
 * - Image formats: jpg, png, jpeg, gif, webp
 * - Max size: 5MB per image
 * - Cloudinary auto-optimizes images for web
 *
 * Usage:
 * - req.file.path → Cloudinary image URL
 * - req.file.filename → Cloudinary public_id (for deletion)
 */
const storage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "herya-app/users",
		allowedFormats: ["jpg", "png", "jpeg", "gif", "webp"],
	},
});

/**
 * Multer Configuration for User Profile Image Upload
 * ==================================================
 * Handles single profile image upload for user registration and profile updates.
 *
 * Configuration:
 * - Storage: Cloudinary (defined above)
 * - File size limit: 5MB per image
 * - File count: Single file per request
 * - Formats: jpg, png, gif, webp
 *
 * Usage in Routes:
 * router.post("/register", uploadUserImage.single("profileImage"), controller);
 * router.put("/profile", uploadUserImage.single("profileImage"), controller);
 *
 * Middleware Details:
 * - Extracts file from form field named "profileImage"
 * - Validates file size (max 5MB)
 * - Returns req.file with: path (URL), filename (public_id), originalname, size, mimetype
 * - Profile images are automatically optimized by Cloudinary
 * - Optional field - registration/profile update work without image
 *
 * Error Handling:
 * - LIMIT_FILE_SIZE: Image exceeds 5MB → throws error
 * - MIME type validation: Only jpg, png, gif, webp allowed
 * - Errors caught by handleValidationErrors middleware
 *
 * Use Case:
 * - User profile image during registration
 * - Profile picture updates
 * - Avatar display across app
 */
const uploadUserImage = multer({
	storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB max
	},
	fileFilter: (_, file, cb) => {
		const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
		allowedMimes.includes(file.mimetype)
			? cb(null, true)
			: cb(new Error("Solo jpg, png, gif, webp permitidos"));
	},
});

module.exports = { uploadUserImage };
