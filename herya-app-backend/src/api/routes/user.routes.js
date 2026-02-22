const {
	getMyProfile,
	updateMyProfile,
	deleteMyAccount,
	updateMyPassword,
	getMyStats,
} = require("../controllers/user.controller");
const { uploadUserImage } = require("../../middlewares/upload/user.upload");
const { authenticateToken } = require("../../middlewares/authorization.middleware");
const { handleValidationErrors } = require("../../middlewares/validation.middleware");
const {
	updateProfileValidations,
	changePasswordValidations,
} = require("../validations/user.validations");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");

const usersRouter = require("express").Router();

usersRouter.use(authenticateToken());

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get my profile
 *     description: Retrieve current authenticated user's profile information
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *                     goals:
 *                       type: array
 *                       items:
 *                         type: string
 *                     experienceLevel:
 *                       type: string
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
usersRouter.get("/me", asyncErrorWrapper(getMyProfile));

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: Update my profile
 *     description: Update current user's profile information and optional profile image
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe Updated
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["flexibility", "strength", "balance"]
 *               preferredDuration:
 *                 type: integer
 *                 example: 45
 *               experienceLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: New profile image (jpg, png, webp, gif)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
usersRouter.put(
	"/me",
	uploadUserImage.single("profileImage"),
	...updateProfileValidations,
	handleValidationErrors,
	asyncErrorWrapper(updateMyProfile),
);

/**
 * @swagger
 * /api/v1/users/change-password:
 *   put:
 *     summary: Change my password
 *     description: Update current user's password (requires current password verification)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: oldPassword123
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: newPassword123
 *               confirmPassword:
 *                 type: string
 *                 example: newPassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
usersRouter.put(
	"/change-password",
	...changePasswordValidations,
	handleValidationErrors,
	asyncErrorWrapper(updateMyPassword),
);

/**
 * @swagger
 * /api/v1/users/me:
 *   delete:
 *     summary: Delete my account
 *     description: Permanently delete current user account and all associated data
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
usersRouter.delete("/me", asyncErrorWrapper(deleteMyAccount));

/**
 * @swagger
 * /api/v1/users/me/stats:
 *   get:
 *     summary: Get my statistics
 *     description: Retrieve practice statistics for current user (sessions, progress, etc.)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalSessions:
 *                       type: integer
 *                     totalPracticeDuration:
 *                       type: integer
 *                     favoriteSequences:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       500:
 *         description: Server error
 */
usersRouter.get("/me/stats", asyncErrorWrapper(getMyStats));

module.exports = usersRouter;
