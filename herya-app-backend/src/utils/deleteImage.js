const { cloudinary } = require("../config/cloudinary");

/**
 * Utility function to delete images from Cloudinary
 *
 * Safely deletes an image from Cloudinary storage by its public ID.
 * This function is designed to be called when cleaning up orphaned images
 * (e.g., when user registration fails, duplicate email, validation errors, etc.).
 *
 * The function gracefully handles errors without interrupting the main application flow.
 * If deletion fails, it only logs the error to the console without throwing an exception.
 * This prevents failed image deletion from breaking the API response.
 *
 * @param {string} publicId - Cloudinary public ID of the image to delete
 *                           (e.g., "herya-app/users/abc123xyz")
 * @returns {Promise<void>} Resolves when deletion is attempted (success or logged error)
 *
 * Behavior:
 * - If publicId is null/undefined: Silently returns without attempting deletion
 * - If deletion succeeds: Image is removed from Cloudinary
 * - If deletion fails: Error is logged to console, but promise still resolves
 *
 * @example
 * // Delete user profile image on registration failure
 * if (userAlreadyExists) {
 *   await deleteImgCloudinary(req.file.filename);
 *   throw createError(400, "User already exists");
 * }
 *
 * @example
 * // Delete album cover on validation error
 * if (validationFailed) {
 *   await deleteImgCloudinary(req.file.filename);
 *   // Error handler will respond to user
 * }
 */
const deleteImgCloudinary = async (publicId) => {
	if (!publicId) {
		return;
	}
	try {
		await cloudinary.uploader.destroy(publicId);
	} catch (error) {
		console.error(
			`[Cloudinary] Failed to delete image ${publicId}:`,
			error.message,
		);
		// Don't throw error - just log it to avoid breaking the main flow
	}
};

module.exports = { deleteImgCloudinary };
