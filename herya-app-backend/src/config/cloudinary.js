/**
 * Cloudinary Configuration
 * ========================
 * Initializes and configures Cloudinary cloud storage service for file uploads.
 *
 * Purpose:
 * - Configure Cloudinary API credentials from environment variables
 * - Validate required environment variables at startup
 * - Export configured cloudinary instance for use in middlewares
 * - Support image and video uploads, transformations, and optimization
 *
 * Integrated Features:
 * - Image upload: jpg, png, gif, webp with automatic optimization
 * - Video storage: mp4, webm, mov, avi with transcoding
 * - Audio storage: mp3, wav, m4a, webm voice notes
 * - Auto-resize and compress media based on Cloudinary transformations
 * - Unique public_id generation for image management
 *
 * Environment Variables Required:
 * - CLOUDINARY_CLOUD_NAME: Cloud name from Cloudinary dashboard
 * - CLOUDINARY_API_KEY: API key for authentication
 * - CLOUDINARY_API_SECRET: API secret for secure operations (private uploads)
 *
 * Storage Folders Structure:
 * - herya-app/users → User profile images
 * - herya-app/poses → Pose demonstration images and videos
 * - herya-app/journal-entries → Journal photos and voice notes
 *
 * Usage:
 * - Used by multer-storage-cloudinary in middleware files:
 *   - src/middlewares/upload/user.upload.js
 *   - src/middlewares/upload/pose.upload.js
 *   - src/middlewares/upload/journal.upload.js
 *   - src/middlewares/file.js
 *
 * Error Handling:
 * - Logs warning if environment variables are missing
 * - Cloudinary will fail at upload time if credentials are invalid
 * - Consider adding runtime validation for production
 *
 * @example
 * // In middleware
 * const { cloudinary } = require("../../config/cloudinary");
 * const storage = new CloudinaryStorage({
 *   cloudinary,
 *   params: {
 *     folder: "herya-app/users",
 *     allowedFormats: ["jpg", "png"]
 *   }
 * });
 *
 * @see https://cloudinary.com/documentation/node_integration
 * @see https://github.com/affanshahid/multer-storage-cloudinary
 */
const cloudinary = require("cloudinary").v2;

// Validate required environment variables
const requiredEnvVars = [
	"CLOUDINARY_CLOUD_NAME",
	"CLOUDINARY_API_KEY",
	"CLOUDINARY_API_SECRET",
];

const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingVars.length > 0) {
	console.warn(
		`⚠️ Warning: Missing Cloudinary environment variables: ${missingVars.join(", ")}`,
	);
	console.warn("File uploads will fail. Configure these in your .env file:");
	console.warn("CLOUDINARY_CLOUD_NAME");
	console.warn("CLOUDINARY_API_KEY");
	console.warn("CLOUDINARY_API_SECRET");
}

/**
 * Configure Cloudinary with API credentials
 * Credentials are retrieved from environment variables
 * @see https://cloudinary.com/documentation/node_integration#configuration
 */
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = { cloudinary };
