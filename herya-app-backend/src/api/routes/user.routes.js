const {
	getMyProfile,
	updateMyProfile,
	deleteMyAccount,
	updateMyPassword,
	getMyStats,
	updateMyProfileImage,
	deleteMyProfileImage,
} = require("../controllers/user.controller");
const { uploadUserImage } = require("../../middlewares/upload/user.upload");
const {
	authenticateToken,
} = require("../../middlewares/authorization.middleware");
const {
	handleValidationErrors,
} = require("../../middlewares/validation.middleware");
const {
	updateProfileValidations,
	changePasswordValidations,
} = require("../validations/user.validations");

const usersRouter = require("express").Router();

usersRouter.use(authenticateToken());

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get my profile
 *     description: Retrieve current authenticated user's profile information and preferences
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
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [user, admin]
 *                 profileImageUrl:
 *                   type: string
 *                 pronouns:
 *                   type: string
 *                   example: she/her
 *                 goals:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [increase_flexibility, build_strength, reduce_stress, improve_balance, therapeutic_healing, deepen_practice, meditation_focus, breath_awareness]
 *                 totalSessions:
 *                   type: integer
 *                 totalMinutes:
 *                   type: integer
 *                 currentStreak:
 *                   type: integer
 *                 lastPracticeDate:
 *                   type: string
 *                   format: date-time
 *                 preferences:
 *                   type: object
 *                   properties:
 *                     practiceIntensity:
 *                       type: string
 *                       enum: [gentle, moderate, vigorous]
 *                     sessionDuration:
 *                       type: integer
 *                     timeOfDay:
 *                       type: string
 *                       enum: [morning, afternoon, evening, anytime]
 *                     language:
 *                       type: string
 *                       enum: [en, es]
 *                     lowStimMode:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRouter.get("/me", getMyProfile);

/**
 * @swagger
 * /api/v1/users/me:
 *   put:
 *     summary: Update my profile
 *     description: Update current user's profile information and optional profile image. Practice history metadata is system-managed and cannot be changed here.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               pronouns:
 *                 type: string
 *                 example: they/them
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [increase_flexibility, build_strength, reduce_stress, improve_balance, therapeutic_healing, deepen_practice, meditation_focus, breath_awareness]
 *                 example: ["reduce_stress", "improve_balance"]
 *               preferences:
 *                 type: object
 *                 properties:
 *                   practiceIntensity:
 *                     type: string
 *                     enum: [gentle, moderate, vigorous]
 *                     example: moderate
 *                   sessionDuration:
 *                     type: integer
 *                     description: Preferred session duration in minutes
 *                     example: 45
 *                   timeOfDay:
 *                     type: string
 *                     enum: [morning, afternoon, evening, anytime]
 *                     example: morning
 *                   lowStimMode:
 *                     type: boolean
 *                     example: true
 *                   notifications:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       frequency:
 *                         type: string
 *                         enum: [daily, weekly, never]
 *                       reminderTime:
 *                         type: string
 *                         description: Reminder time in HH:mm format (e.g. "09:00")
 *                   language:
 *                     type: string
 *                     enum: [en, es]
 *                     example: es
 *                   theme:
 *                     type: string
 *                     enum: [light, dark]
 *                     example: dark
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: New profile image (jpg, png, webp, gif)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error or email already in use
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - attempted to change role, password, or practice history metadata
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRouter.put(
	"/me",
	uploadUserImage.single("profileImage"),
	...updateProfileValidations,
	handleValidationErrors,
	updateMyProfile,
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
 *                 minLength: 8
 *                 example: NewPassword123
 *               confirmPassword:
 *                 type: string
 *                 example: NewPassword123
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
	updateMyPassword,
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
usersRouter.delete("/me", deleteMyAccount);

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
 *                 totalSessions:
 *                   type: integer
 *                 totalMinutes:
 *                   type: integer
 *                 currentStreak:
 *                   type: integer
 *                 lastPracticeDate:
 *                   type: string
 *                   format: date-time
 *                 sessionsPerWeek:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   description: Session count for each of the last 4 weeks (oldest to newest)
 *                 mostPracticedFamilies:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       family:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 avgDuration:
 *                   type: integer
 *                   description: Average session duration in minutes (last 4 weeks)
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRouter.get("/me/stats", getMyStats);

/**
 * @swagger
 * /api/v1/users/me/image:
 *   put:
 *     summary: Update my profile image
 *     description: Upload a new profile image (replaces existing image)
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
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *       400:
 *         description: No image file provided
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRouter.put(
	"/me/image",
	uploadUserImage.single("profileImage"),
	updateMyProfileImage,
);

/**
 * @swagger
 * /api/v1/users/me/image:
 *   delete:
 *     summary: Delete my profile image
 *     description: Remove the current user's profile image
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile image deleted successfully
 *       400:
 *         description: User has no profile image to delete
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRouter.delete("/me/image", deleteMyProfileImage);

module.exports = usersRouter;
