const multer = require("multer");
const { cloudinary } = require("../../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/**
 * Multer Storage Configuration for Pose Media (Images & Videos)
 * ==============================================================
 * Configures Cloudinary storage for yoga pose demonstration media.
 *
 * Features:
 * - Stores media in Cloudinary cloud (not local disk)
 * - Organizes uploads in "herya-app/poses" folder
 * - Supports multiple image formats (jpg, png, jpeg, gif, webp)
 * - Supports video formats (mp4, webm, mov, avi)
 * - Automatically generates public_id for media management
 * - Returns URL and public_id in req.file(s)
 *
 * Storage Details:
 * - Folder: "herya-app/poses"
 * - Image formats: jpg, png, jpeg, gif, webp
 * - Video formats: mp4, webm, mov, avi
 * - Max size limit: 50MB (configured in upload middleware)
 * - Video transcoding: handled by Cloudinary
 *
 * Usage:
 * - req.file.path → Cloudinary media URL
 * - req.file.filename → Cloudinary public_id (for deletion)
 * - req.files (with .array()) → array of uploaded media
 */
const poseMediaStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "herya-app/poses",
		allowedFormats: [
			// Images
			"jpg",
			"png",
			"jpeg",
			"gif",
			"webp",
			// Videos
			"mp4",
			"webm",
			"mov",
			"avi",
		],
		resource_type: "auto", // Automatically detect image or video
	},
});

/**
 * Multer Configuration for Pose Thumbnail Image
 * =============================================
 * Handles single thumbnail image upload for pose.
 *
 * Configuration:
 * - Storage: Cloudinary (defined above)
 * - File size limit: 5MB (thumbnails should be small)
 * - File count: Single file per request
 *
 * Usage in Routes:
 * router.post("/pose", uploadPoseThumbnail.single("thumbnail"), controller);
 * router.put("/pose/:id", uploadPoseThumbnail.single("thumbnail"), controller);
 *
 * Middleware Details:
 * - Extracts file from form field named "thumbnail"
 * - Validates file size (max 5MB)
 * - Returns req.file with: path (URL), filename (public_id), originalname, size, mimetype
 */
const uploadPoseThumbnail = multer({
	storage: poseMediaStorage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB
	},
	fileFilter: (_, file, cb) => {
		// Validate MIME type for images only
		const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type for thumbnail. Only jpg, png, gif, webp allowed"));
		}
	},
});

/**
 * Multer Configuration for Multiple Pose Images
 * ==============================================
 * Handles multiple image uploads for demonstration photos.
 *
 * Configuration:
 * - Storage: Cloudinary (defined above)
 * - File size limit: 5MB per image
 * - File count: Up to 10 images per request
 * - Format: Images only (jpg, png, gif, webp)
 *
 * Usage in Routes:
 * router.post("/pose/:id/images", uploadPoseImages.array("images", 10), controller);
 *
 * Middleware Details:
 * - Extracts files from form field named "images"
 * - Validates file size for each image (max 5MB)
 * - Returns req.files array with uploaded image details
 * - Each file: path (URL), filename (public_id), originalname, size, mimetype
 */
const uploadPoseImages = multer({
	storage: poseMediaStorage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB per image
	},
	fileFilter: (_, file, cb) => {
		// Validate MIME type for images only
		const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type. Only jpg, png, gif, webp allowed"));
		}
	},
});

/**
 * Multer Configuration for Pose Instruction Videos
 * ================================================
 * Handles video uploads for pose demonstrations.
 *
 * Configuration:
 * - Storage: Cloudinary (defined above)
 * - File size limit: 50MB per video
 * - File count: Up to 5 videos per request
 * - Formats: mp4, webm, mov, avi
 * - Cloudinary auto-transcodes for web optimization
 *
 * Usage in Routes:
 * router.post("/pose/:id/videos", uploadPoseVideos.array("videos", 5), controller);
 *
 * Middleware Details:
 * - Extracts files from form field named "videos"
 * - Validates file size (max 50MB per video)
 * - Returns req.files array with video details
 * - Each file: path (URL), filename (public_id), originalname, size, mimetype
 * - Cloudinary handles video transcoding and streaming optimization
 */
const uploadPoseVideos = multer({
	storage: poseMediaStorage,
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB per video
	},
	fileFilter: (_, file, cb) => {
		// Validate MIME type for videos only
		const allowedMimes = [
			"video/mp4",
			"video/webm",
			"video/quicktime", // .mov
			"video/avi",
		];

		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type. Only mp4, webm, mov, avi allowed for videos"));
		}
	},
});

/**
 * Error Handler for Pose Upload Middleware
 * ========================================
 * Handles multer errors for pose media uploads gracefully.
 *
 * Common Errors:
 * - LIMIT_FILE_SIZE: File exceeds size limit (5MB images, 50MB videos)
 * - LIMIT_FILE_COUNT: Too many files uploaded
 * - LIMIT_FIELD_VALUE: Field value too long
 * - MIMETYPE: Invalid file type
 *
 * Usage in Error Middleware:
 * app.use((err, req, res, next) => {
 *   if (err instanceof multer.MulterError) {
 *     return res.status(400).json({
 *       success: false,
 *       message: uploadPoseErrorHandler(err.code)
 *     });
 *   }
 *   next(err);
 * });
 */
/**
 * Error Handler for Pose Upload Middleware
 * ========================================
 * Handles multer errors for pose media uploads gracefully.
 *
 * Common Errors:
 * - LIMIT_FILE_SIZE: File exceeds size limit (5MB images, 50MB videos)
 * - LIMIT_FILE_COUNT: Too many files uploaded
 * - LIMIT_FIELD_VALUE: Field value too long
 * - MIMETYPE: Invalid file type
 *
 * Usage in Error Middleware:
 * app.use((err, req, res, next) => {
 *   if (err instanceof multer.MulterError) {
 *     return res.status(400).json({
 *       success: false,
 *       message: uploadPoseErrorHandler(err.code)
 *     });
 *   }
 *   next(err);
 * });
 */
const uploadPoseErrorHandler = (code) => {
	const errorMessages = {
		LIMIT_FILE_SIZE: "File size too large. Images max 5MB, videos max 50MB.",
		LIMIT_FILE_COUNT: "Too many files. Max 10 images or 5 videos per upload.",
		LIMIT_FIELD_KEY: "Field name too long.",
		LIMIT_FIELD_VALUE: "Field value too long.",
		LIMIT_FIELD_COUNT: "Too many fields.",
		LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
	};

	return errorMessages[code] || "Pose media upload failed.";
};

/**
 * Multer Configuration for Mixed Pose Media Upload
 * ================================================
 * Allows simultaneous upload of thumbnail, multiple images, and videos.
 *
 * Configuration:
 * - Storage: Cloudinary
 * - File size limits: 5MB images, 50MB videos
 * - File counts: 1 thumbnail, up to 10 images, up to 5 videos
 * - Formats: All image and video types
 *
 * Usage in Routes:
 * router.post("/pose", uploadPoseMixed.fields([
 *   { name: "thumbnail", maxCount: 1 },
 *   { name: "images", maxCount: 10 },
 *   { name: "videos", maxCount: 5 }
 * ]), controller);
 *
 * Middleware Details:
 * - req.files.thumbnail → array with single uploaded thumbnail
 * - req.files.images → array of uploaded images (max 10)
 * - req.files.videos → array of uploaded videos (max 5)
 * - Each file: path (URL), filename (public_id), originalname, size, mimetype
 *
 * Use Case:
 * - Complete pose creation with thumbnail, demo images, and instruction videos
 * - Single request handling multiple media types
 */
const uploadPoseMixed = multer({
	storage: poseMediaStorage,
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB max (accommodates videos)
	},
	fileFilter: (_, file, cb) => {
		// Validate MIME type for both images and videos
		const allowedMimes = [
			// Images
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
			// Videos
			"video/mp4",
			"video/webm",
			"video/quicktime",
			"video/avi",
		];

		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(
				new Error(
					"Invalid file type. Only images (jpg, png, gif, webp) and videos (mp4, webm, mov, avi) allowed",
				),
			);
		}
	},
}).fields([
	{ name: "thumbnail", maxCount: 1 },
	{ name: "images", maxCount: 10 },
	{ name: "videos", maxCount: 5 },
]);

module.exports = {
	uploadPoseThumbnail,
	uploadPoseImages,
	uploadPoseVideos,
	uploadPoseMixed,
	uploadPoseErrorHandler,
};
