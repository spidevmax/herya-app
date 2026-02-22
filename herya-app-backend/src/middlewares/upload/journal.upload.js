const multer = require("multer");
const { cloudinary } = require("../../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/**
 * Multer Storage Configuration for Journal Entry Media (Photos & Voice Notes)
 * ===========================================================================
 * Configures Cloudinary storage for journal entry multimedia attachments.
 *
 * Features:
 * - Stores media in Cloudinary cloud (not local disk)
 * - Organizes uploads in "herya-app/journal-entries" folder
 * - Supports image formats (jpg, png, jpeg, gif, webp)
 * - Supports audio formats (mp3, wav, m4a, webm)
 * - Automatically generates public_id for media management
 * - Returns URL and public_id in req.file(s)
 *
 * Storage Details:
 * - Folder: "herya-app/journal-entries"
 * - Image formats: jpg, png, jpeg, gif, webp
 * - Audio formats: mp3, wav, m4a, webm
 * - Max size: 5MB images, 10MB audio files
 * - Audio transcoding: handled by Cloudinary
 *
 * Usage:
 * - req.file.path → Cloudinary media URL
 * - req.file.filename → Cloudinary public_id (for deletion)
 * - req.files (with .array()) → array of uploaded media
 */
const journalMediaStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: "herya-app/journal-entries",
		allowedFormats: [
			// Images
			"jpg",
			"png",
			"jpeg",
			"gif",
			"webp",
			// Audio
			"mp3",
			"wav",
			"m4a",
			"webm",
		],
		resource_type: "auto", // Automatically detect image or audio
	},
});

/**
 * Multer Configuration for Journal Photos
 * =======================================
 * Handles multiple photo uploads for journal entries.
 *
 * Configuration:
 * - Storage: Cloudinary (defined above)
 * - File size limit: 5MB per image
 * - File count: Up to 10 photos per journal entry
 * - Formats: jpg, png, gif, webp
 *
 * Usage in Routes:
 * router.post("/journal/:id/photos", uploadJournalPhotos.array("photos", 10), controller);
 *
 * Middleware Details:
 * - Extracts files from form field named "photos"
 * - Validates file size (max 5MB per photo)
 * - Returns req.files array with photo details
 * - Each file: path (URL), filename (public_id), originalname, size, mimetype
 * - Photos are automatically compressed by Cloudinary
 *
 * Use Case:
 * - Pose photos during practice
 * - Environment documentation
 * - Props and setup images
 */
const uploadJournalPhotos = multer({
	storage: journalMediaStorage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB per photo
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
 * Multer Configuration for Voice Notes
 * ====================================
 * Handles voice note (audio) uploads for journal entries.
 *
 * Configuration:
 * - Storage: Cloudinary (defined above)
 * - File size limit: 10MB per audio file
 * - File count: Up to 5 voice notes per journal entry
 * - Formats: mp3, wav, m4a, webm
 * - Cloudinary auto-optimizes audio for web streaming
 *
 * Usage in Routes:
 * router.post("/journal/:id/voice-notes", uploadJournalVoiceNotes.array("voiceNotes", 5), controller);
 *
 * Middleware Details:
 * - Extracts files from form field named "voiceNotes"
 * - Validates file size (max 10MB per audio file)
 * - Returns req.files array with audio details
 * - Each file: path (URL), filename (public_id), originalname, size, mimetype
 * - Duration validation handled in controller
 * - Audio transcoding optimized by Cloudinary for playback
 *
 * Use Case:
 * - Voice reflections post-practice
 * - Meditation insights and observations
 * - Breath awareness notes
 * - Quick audio thoughts during practice
 */
const uploadJournalVoiceNotes = multer({
	storage: journalMediaStorage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB per audio file
	},
	fileFilter: (_, file, cb) => {
		// Validate MIME type for audio only
		const allowedMimes = [
			"audio/mpeg", // .mp3
			"audio/wav",
			"audio/mp4", // .m4a
			"audio/webm",
		];

		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Invalid file type. Only mp3, wav, m4a, webm allowed for audio"));
		}
	},
});

/**
 * Multer Configuration for Mixed Media Upload
 * ===========================================
 * Allows simultaneous upload of photos and voice notes.
 *
 * Configuration:
 * - Storage: Cloudinary (defined above)
 * - File size limit: 5MB images, 10MB audio
 * - File count: Up to 10 images + 5 audio files
 * - Formats: All image and audio types
 *
 * Usage in Routes:
 * router.post("/journal/:id/media", uploadJournalMixed.fields([
 *   { name: "photos", maxCount: 10 },
 *   { name: "voiceNotes", maxCount: 5 }
 * ]), controller);
 *
 * Middleware Details:
 * - Uses .fields() for multiple file input names
 * - req.files.photos → array of uploaded photos
 * - req.files.voiceNotes → array of uploaded voice notes
 * - Each file: path (URL), filename (public_id), originalname, size, mimetype
 * - Type validation done via fileFilter
 *
 * Use Case:
 * - Complete journal entry with both visual and audio documentation
 * - Single request handling multiple media types
 * - Efficient batch uploads
 */
const uploadJournalMixed = multer({
	storage: journalMediaStorage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB max (accommodates audio)
	},
	fileFilter: (_, file, cb) => {
		// Validate MIME type for both images and audio
		const allowedMimes = [
			// Images
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
			// Audio
			"audio/mpeg",
			"audio/wav",
			"audio/mp4",
			"audio/webm",
		];

		if (allowedMimes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(
				new Error(
					"Invalid file type. Only images (jpg, png, gif, webp) and audio (mp3, wav, m4a, webm) allowed",
				),
			);
		}
	},
});

/**
 * Error Handler for Journal Upload Middleware
 * ==========================================
 * Handles multer errors for journal media uploads gracefully.
 *
 * Common Errors:
 * - LIMIT_FILE_SIZE: File exceeds size limit (5MB images, 10MB audio)
 * - LIMIT_FILE_COUNT: Too many files uploaded
 * - LIMIT_FIELD_VALUE: Field value too long
 * - MIMETYPE: Invalid file type
 *
 * Usage in Error Middleware:
 * app.use((err, req, res, next) => {
 *   if (err instanceof multer.MulterError) {
 *     return res.status(400).json({
 *       success: false,
 *       message: uploadJournalErrorHandler(err.code)
 *     });
 *   }
 *   next(err);
 * });
 */
const uploadJournalErrorHandler = (code) => {
	const errorMessages = {
		LIMIT_FILE_SIZE: "File size too large. Images max 5MB, audio max 10MB.",
		LIMIT_FILE_COUNT: "Too many files. Max 10 photos or 5 voice notes per upload.",
		LIMIT_FIELD_VALUE: "Field value too long.",
		LIMIT_FIELD_COUNT: "Too many fields.",
		LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
	};

	return errorMessages[code] || "Journal media upload failed.";
};

module.exports = {
	uploadJournalPhotos,
	uploadJournalVoiceNotes,
	uploadJournalMixed,
	uploadJournalErrorHandler,
};
