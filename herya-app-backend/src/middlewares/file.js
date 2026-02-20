const multer = require("multer");
const { cloudinary } = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/**
 * Legacy: Multer Storage Configuration for Pose Images
 * ===================================================
 * LEGACY MIDDLEWARE - Consider using /upload/pose.upload.js instead
 *
 * This file provides a generic pose image upload middleware.
 * For production, use the dedicated middlewares in src/middlewares/upload/:
 * - upload/pose.upload.js → uploadPoseThumbnail, uploadPoseImages, uploadPoseVideos
 * - upload/user.upload.js → uploadUserImage (profile images)
 * - upload/journal.upload.js → uploadJournalPhotos, uploadJournalVoiceNotes
 *
 * Purpose:
 * - Stores pose demonstration images in Cloudinary cloud storage
 * - Provides generic single-file upload without size/format restrictions
 * - Organizes uploads in "Poses" folder for centralized management
 * - Automatically handles image optimization by Cloudinary
 *
 * Storage Details:
 * - Folder: "Poses" (generic, not hierarchical)
 * - Allowed formats: jpg, png, jpeg, gif, webp
 * - No file size limit configured (relies on Cloudinary defaults)
 * - Source: Cloudinary configuration from config/cloudinary.js
 *
 * Image Management:
 * - Returns req.file.path with full Cloudinary URL (publicly accessible)
 * - Returns req.file.filename with public_id for deletion/updates
 * - Cloudinary auto-optimizes images for web delivery
 * - Original filename available in req.file.originalname
 *
 * When to Use This Middleware:
 * - Legacy code that hasn't migrated to specific upload/* middlewares
 * - Simple generic image uploads without size constraints
 * - Testing and development environments
 * - Admin utilities for general file management
 *
 * When NOT to Use (Prefer Specific Middlewares):
 * ✅ Pose thumbnails/images/videos → use upload/pose.upload.js
 * ✅ User profile images → use upload/user.upload.js
 * ✅ Journal photos/voice notes → use upload/journal.upload.js
 *
 * Request Structure:
 * - Form field name: "poseImage" (or any custom field name)
 * - Method: multipart/form-data in HTTP request
 * - Single file: Use upload.single("fieldname")
 * - Multiple files: Use upload.array("fieldname", limit)
 *
 * Response in req.file:
 * - path: Cloudinary URL of uploaded image (HTTPS)
 * - filename: Public ID (unique identifier for deletion/updates)
 * - originalname: Original filename from client
 * - size: File size in bytes
 * - mimetype: Image MIME type (image/jpeg, image/png, etc.)
 * - encoding: Encoding of uploaded file
 *
 * Configuration:
 * - Storage backend: Cloudinary (cloud-based, not local disk)
 * - No file rate limiting configured
 * - No file size validation (add limits in specific middlewares)
 * - URL format: Responsive and optimizable via Cloudinary transformations
 * - Media type auto-detection via resource_type
 *
 * Error Handling:
 * - File type validation: Handled by Cloudinary allowedFormats parameter
 * - File size validation: Not configured (add via limits property)
 * - Upload errors: Should be caught in express error middleware
 * - Path is accessible in req.file.path if upload succeeds
 *
 * Cloudinary Features Available:
 * - Image transformation: resize, crop, rotate, format conversion
 * - Quality optimization: Auto compression based on device
 * - Responsive images: Automatic format selection (WebP for modern browsers)
 * - EXIF data removal: Privacy protection for photos
 * - Face detection: For smart cropping (advanced feature)
 *
 * @config {CloudinaryStorage} storage - Cloudinary storage instance
 * @property {string} folder - Destination folder in Cloudinary ("Poses")
 * @property {array} allowedFormats - Supported: ["jpg", "png", "jpeg", "gif", "webp"]
 * @property {string} resource_type - Set to "auto" for mixed media (images + videos)
 *
 * @example
 * // Basic single image upload
 * router.post("/pose", upload.single("poseImage"), (req, res) => {
 *   const imageUrl = req.file.path;
 *   const publicId = req.file.filename;
 *   // Save to database with imageUrl
 * });
 *
 * @example
 * // Multiple image upload
 * router.post("/gallery", upload.array("images", 5), (req, res) => {
 *   const urls = req.files.map(f => f.path);
 *   // Save all URLs to database
 * });
 *
 * @example
 * // With error handling
 * router.post("/upload", (req, res, next) => {
 *   upload.single("file")(req, res, (err) => {
 *     if (err) return res.status(400).json({ error: err.message });
 *     // Process successful upload
 *   });
 * });
 *
 * @see config/cloudinary.js - Cloudinary configuration
 * @see middlewares/upload/pose.upload.js - Dedicated pose upload with specific size/format limits
 * @see middlewares/upload/user.upload.js - User profile image uploads
 * @see middlewares/upload/journal.upload.js - Journal media uploads
 */
const storage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "herya-app/poses",
		allowedFormats: ["jpg", "png", "jpeg", "gif", "webp"],
		resource_type: "auto",
	},
});

/**
 * Multer Middleware for Generic File Upload
 * ========================================
 * Basic file upload middleware using Cloudinary storage.
 *
 * This is a generic, unconstrained upload handler. For production use,
 * prefer the specialized middlewares in src/middlewares/upload/ that include:
 * - Specific file size limits per media type
 * - Proper MIME type validation
 * - Error handling and user feedback
 * - Organized folder hierarchies
 * - Format restrictions (e.g., images only, or videos only)
 *
 * File Upload Flow:
 * 1. Client sends multipart/form-data request
 * 2. Multer extracts file from specified form field
 * 3. CloudinaryStorage uploads to Cloudinary API
 * 4. Cloudinary returns URL and public_id
 * 5. Middleware attaches req.file with upload details
 * 6. Controller processes req.file and saves data to MongoDB
 *
 * Middleware Options:
 * - Single file: upload.single("fieldname")
 * - Multiple files: upload.array("fieldname", maxCount)
 * - Mixed fields: upload.fields([...])
 * - None specified: Default to single file mode
 *
 * Success Response Structure (req.file):
 * ```
 * {
 *   fieldname: "poseImage",
 *   originalname: "tadasana.jpg",
 *   encoding: "7bit",
 *   mimetype: "image/jpeg",
 *   path: "https://res.cloudinary.com/...",
 *   filename: "herya-app/poses/abc123xyz",
 *   size: 245120,
 *   resource_type: "image",
 *   type: "upload"
 * }
 * ```
 *
 * Production Recommendations:
 * - Move to specific middlewares in upload/ folder
 * - Add file size limits based on media type
 * - Add MIME type validation
 * - Implement error handlers for upload failures
 * - Log all uploads for auditing
 * - Consider rate limiting for public endpoints
 * - Validate file content (not just extension/MIME)
 * - Add virus scanning for production systems
 *
 * @middleware {multer} upload - File upload middleware
 * @type {multer.Multer}
 *
 * @example
 * // Simple single file upload
 * const { upload } = require("./middlewares/file");
 * router.post("/pose", upload.single("poseImage"), poseController.createPose);
 *
 * @example
 * // Multiple file upload
 * const { upload } = require("./middlewares/file");
 * router.post("/gallery", upload.array("images", 5), galleryController.create);
 */
const upload = multer({ storage });

module.exports = { upload };
