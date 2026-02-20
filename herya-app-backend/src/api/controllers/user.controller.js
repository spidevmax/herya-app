const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const { deleteImgCloudinary } = require("../../utils/deleteImage");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

/**
 * Controller: getMyProfile
 * ------------------------
 * Retrieves the authenticated user's profile (excluding the password).
 *
 * Workflow:
 * 1. Uses `req.user._id` (set by isAuth) to find the current user in the database.
 * 2. Excludes the password field using `.select("-password")`.
 * 3. Sends a 200 response with the user’s profile data.
 *
 * Error Handling:
 * - Throws 404 if the user cannot be found.
 * - Any other errors are forwarded to the global error handler.
 *
 * Notes:
 * - Requires `isAuth` middleware to ensure `req.user` is available.
 * - Ideal for displaying personal information on a “My Profile” page.
 */

const getMyProfile = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		if (!user) {
			throw createError(404, "User not found");
		}

		return sendResponse(res, 200, true, "User fetched successfully", user);
	} catch (error) {
		next(error);
	}
};

/**
 * Controller: updateMyProfile
 * ---------------------------
 * Allows the authenticated user to update their own profile information.
 *
 * Workflow:
 * 1. Finds the user using `req.user._id`.
 * 2. Prevents changes to restricted fields:
 *    - Cannot change `role` (throws 403).
 *    - Cannot change `password` here (must use `/users/change-password`).
 * 3. Updates allowed fields: `name`, `email`, and optionally the profile image.
 * 4. If a new image is uploaded, deletes the old one from Cloudinary.
 * 5. Saves and returns the updated user (excluding password).
 *
 * Error Handling:
 * - Throws 403 if the user tries to change restricted fields.
 * - Throws 404 if the user does not exist.
 * - Uses `next(error)` to pass errors to the global handler.
 *
 * Notes:
 * - Requires `isAuth` middleware.
 * - Uses `multer` with Cloudinary for image upload management.
 * - Returns sanitized user data without password.
 */

const updateMyProfile = async (req, res, next) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			throw createError(404, "User not found");
		}

		// An user with the role "user" cannot change any role
		if (req.body.role) {
			//      delete req.body.role;
			throw createError(403, "You are not allowed to change your role");
		}

		// The user cannot change their password in this route
		if (req.body.password) {
			throw createError(
				403,
				"You are not allowed to change your password here. Use /users/change-password instead",
			);
		}

		// Update fields
		if (req.body.name) {
			user.name = req.body.name.trim();
		}
		if (req.body.email) {
			user.email = req.body.email.toLowerCase().trim();
		}

		// If there is a new image, replace the previous one
		if (req.file) {
			if (user.profileImageId) {
				await deleteImgCloudinary(user.profileImageId);
			}
			user.profileImageUrl = req.file.path;
			user.profileImageId = req.file.filename;
		}

		const updatedUser = await user.save();

		// Delete password before updating
		const userReponse = updatedUser.toObject();
		delete userReponse.password;

		return sendResponse(
			res,
			200,
			true,
			"Profile updated successfully",
			userReponse,
		);
	} catch (error) {
		next(error);
	}
};

/**
 * Controller: changeMyPassword
 * ----------------------------
 * Allows the authenticated user to securely change their password.
 *
 * Workflow:
 * 1. Extracts `currentPassword`, `newPassword`, and `confirmPassword` from the request body.
 * 2. Validates that all fields are provided and that the new passwords match.
 * 3. Compares the provided current password with the stored (hashed) password.
 * 4. Validates password length (minimum 8 characters).
 * 5. If valid, assigns the new password — triggering the bcrypt pre-save hook.
 * 6. Returns a 200 response on success.
 *
 * Error Handling:
 * - 400 if fields are missing or new passwords don’t match.
 * - 401 if current password is incorrect.
 * - 404 if the user is not found.
 *
 * Notes:
 * - The password hashing occurs automatically via the `pre("save")` hook in the User model.
 * - `isAuth` middleware is required to access this route.
 * - Does not return the user object, only a success message for security reasons.
 */

const changeMyPassword = async (req, res, next) => {
	try {
		const { currentPassword, newPassword, confirmPassword } = req.body;

		if (!currentPassword || !newPassword || !confirmPassword) {
			throw createError(400, "All fields are required");
		}

		if (newPassword !== confirmPassword) {
			throw createError(400, "New passwords do not match");
		}

		const user = await User.findById(req.user._id);
		if (!user) {
			throw createError(404, "User not found");
		}

		const isMatch = await bcrypt.compare(currentPassword, user.password);
		if (!isMatch) {
			throw createError(401, "Current password is incorrect");
		}

		if (newPassword.length < 8) {
			throw createError(400, "Password must be at least 8 characters long");
		}

		user.password = newPassword;
		await user.save();

		return sendResponse(
			res,
			200,
			true,
			"Password changed successfully",
			user.password,
		);
	} catch (error) {
		next(error);
	}
};

/**
 * Controller: deleteMyAccount
 * ---------------------------
 * Permanently deletes the authenticated user’s account and their Cloudinary image.
 *
 * Workflow:
 * 1. Finds the user by `req.user._id`.
 * 2. If found, deletes the associated Cloudinary profile image (if exists).
 * 3. Deletes the user record from the database.
 * 4. Returns a 200 response confirming deletion.
 *
 * Error Handling:
 * - Throws 404 if the user does not exist.
 * - Any other errors are passed to the global error handler via `next(error)`.
 *
 * Notes:
 * - Requires `isAuth` middleware (user must be logged in).
 * - Does not cascade delete related data (albums, etc.) — handle that separately if needed.
 * - Consider soft-deletion if audit logs are required.
 */

const deleteMyAccount = async (req, res, next) => {
	try {
		// Search for the authenticated user
		const user = await User.findById(req.user._id);

		if (!user) {
			throw createError(404, "User not found");
		}

		//Delete the profile picture
		if (user.profileImageId) {
			await deleteImgCloudinary(user.profileImageId);
		}

		await User.findByIdAndDelete(req.user._id);

		return sendResponse(res, 200, true, "Account deleted successfully", user);
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getMyProfile,
	updateMyProfile,
	changeMyPassword,
	deleteMyAccount,
};
