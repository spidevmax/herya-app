const BreathingPattern = require("../models/BreathingPattern.model");
const Pose = require("../models/Pose.model");
const User = require("../models/User.model");
const { deleteImgCloudinary } = require("../../utils/deleteImage");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");
const { put } = require("../routes/pose.routes");

/**
 * Controller: getAllPoses
 * ------------------------
 * Retrieves all poses in the database.
 * Accessible only to admin users (via isAuth middleware with role validation).
 *
 * Workflow:
 * 1. Fetches all poses using `Pose.find()`.
 * 3. Sends a 200 response containing all poses.
 *
 * Error Handling:
 * - Any database or population error is forwarded to the global error handler.
 *
 * Notes:
 * - Useful for admin dashboards or moderation views.
 * - Regular users cannot access this route.
 */

const getAllPoses = async (req, res, next) => {
	try {
		const poses = await Pose.find();
		return sendResponse(res, 200, true, "Poses fetched successfully", poses);
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/v1/poses/
 * - Creates a new pose.
 * - Applies Schema validations automatically.
 * - If creation is successful, returns 201 with the created document.
 */
const postPose = async (req, res, next) => {
	try {
		const newPose = new Pose(req.body);
		const savedPose = await newPose.save();
		res.status(201).json(savedPose);
	} catch (error) {
		return next(error);
	}
};

/**
 * PUT /api/v1/poses/:id
 * - Updates an existing pose.
 * - { new: true } returns the updated document.
 * - { runValidators: true } respects Schema validations.
 * - If not found, 404. If successful, 200.
 */
const updatePose = async (req, res, next) => {
	try {
		const { poseId } = req.params;
		const updatedPose = await Pose.findByIdAndUpdate(poseId, req.body, {
			new: true,
			runValidators: true,
		});
		if (!updatedPose) {
			return res.status(404).json({ error: "Pose not found" });
		}
		res.status(200).json(updatedPose);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: deletePose
 * ----------------------
 * Deletes a pose by its ID (admin-only operation).
 *
 * Workflow:
 * 1. If the pose has an image in Cloudinary → deletes it using `deleteImgCloudinary()`.
 * 2. Extracts the pose ID from `req.params.id`.
 * 3. Deletes the pose from the database using `findByIdAndDelete`.
 * 4. Returns a 200 response with the deleted pose data.
 *
 * Error Handling:
 * - If no pose is found or a deletion error occurs, forwards the error to the global handler.
 *
 * Notes:
 * - Always check for the existence of `poseDeleted` before accessing its properties.
 * - Used primarily by admins to manage inappropriate or duplicate entries.
 */

const deletePose = async (req, res, next) => {
	try {
		// If there is an image, delete it
		if (req.pose.imageId) {
			await deleteImgCloudinary(req.pose.imageId);
		}

		// Delete the pose
		const deletedPose = await Pose.findByIdAndDelete(req.pose._id);

		return sendResponse(
			res,
			200,
			true,
			"Pose deleted successfully",
			deletedPose,
		);
	} catch (error) {
		next(error);
	}
};

/**
 * POST /api/v1/breathing-patterns/
 * - Creates a new breathing pattern.
 * - Applies Schema validations automatically.
 * - If creation is successful, returns 201 with the created document.
 */
const postBreathingPattern = async (req, res, next) => {
	try {
		const breathingPattern = await BreathingPattern.create(req.body);
		res.status(201).json(breathingPattern);
	} catch (error) {
		return next(error);
	}
};

/**
 * PUT /api/v1/breathing-patterns/:id
 * - Updates an existing breathing pattern.
 * - { new: true } returns the updated document.
 * - { runValidators: true } respects Schema validations.
 * - If not found, 404. If successful, 200.
 */
const updateBreathingPattern = async (req, res, next) => {
	try {
		const updated = await BreathingPattern.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			},
		);
		if (!updated) {
			return res.status(404).json({ error: "Breathing Pattern not found" });
		}
		res.status(200).json(updated);
	} catch (error) {
		return next(error);
	}
};

/**
 * DELETE /api/v1/breathing-patterns/:id
 * - Deletes a breathing pattern by ID.
 * - If not found, 404. If deleted, 200 with confirmation message.
 */
const deleteBreathingPattern = async (req, res, next) => {
	try {
		const deleted = await BreathingPattern.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: "Breathing Pattern not found" });
		}
		res.status(200).json({ message: "Breathing pattern deleted successfully" });
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getAllUsers
 * -----------------------
 * Fetches all users from the database (admin-only operation).
 *
 * Workflow:
 * 1. Retrieves all users using `User.find()`.
 * 2. Sends a 200 response with the list of users.
 *
 * Error Handling:
 * - Any database error is caught and forwarded to the error handler.
 *
 * Notes:
 * - Only admin users (validated by isAuth) can access this endpoint.
 * - Useful for admin panels, moderation tools, or analytics dashboards.
 */

const getAllUsers = async (req, res, next) => {
	try {
		const users = await User.find();
		return sendResponse(res, 200, true, "Users fetched successfully", users);
	} catch (error) {
		next(error);
	}
};

/**
 * Controller: deleteUser
 * ----------------------
 * Deletes a user account by its ID (admin-only operation).
 *
 * Workflow:
 * 1. Extracts the user ID from `req.params.id`.
 * 2. Deletes the user with `User.findByIdAndDelete()`.
 * 3. If the user had a profile image stored in Cloudinary → removes it using `deleteImgCloudinary()`.
 * 4. Returns a 200 response with the deleted user's data.
 *
 * Error Handling:
 * - If the user does not exist or deletion fails, forwards the error to the global handler.
 *
 * Notes:
 * - Important for admin account management.
 * - Always ensure related data (e.g., user albums) are handled or cleaned up as needed.
 */

const deleteUser = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Delete the user and return the deleted document
		const userDeleted = await User.findByIdAndDelete(id);

		if (!userDeleted) {
			throw createError(404, "User not found");
		}

		// Delete Cloudinary image if it exists
		if (userDeleted.profileImageId) {
			await deleteImgCloudinary(userDeleted.profileImageId);
		}

		return sendResponse(
			res,
			200,
			true,
			"User deleted successfully",
			userDeleted,
		);
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getAllPoses,
	postPose,
	updatePose,
	deletePose,
	postBreathingPattern,
	putBreathingPattern,
	deleteBreathingPattern,
	getAllUsers,
	deleteUser,
};
