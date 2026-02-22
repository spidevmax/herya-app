const {
	// User Management
	getAllUsers,
	updateUserRole,
	deleteUser,

	// VK Sequence Management
	createVKSequence,
	updateVKSequence,
	deleteVKSequence,

	// Pose Management
	createPose,
	updatePose,
	deletePose,

	// Breathing Pattern Management
	createBreathingPattern,
	updateBreathingPattern,
	deleteBreathingPattern,

	// Analytics
	getDashboardStats,
	getUserAnalytics,
} = require("../controllers/admin.controller");

const { authenticateToken, isAdmin } = require("../../middlewares/authorization.middleware");

const { handleValidationErrors } = require("../../middlewares/validation.middleware");

const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");

const { uploadPoseMixed } = require("../../middlewares/upload/pose.upload");

const {
	getAllUsersValidation,
	updateUserRoleValidation,
	userIdParamValidation,
	createVKSequenceValidation,
	updateVKSequenceValidation,
	resourceIdParamValidation,
	createPoseValidation,
	updatePoseValidation,
	createBreathingPatternValidation,
	updateBreathingPatternValidation,
	userIdQueryValidation,
} = require("../validations/admin.validations");

const adminRouter = require("express").Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticateToken(), isAdmin);

// ==================== USER MANAGEMENT ====================

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users with optional filtering and pagination (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       500:
 *         description: Server error
 */
adminRouter.get(
	"/users",
	getAllUsersValidation,
	handleValidationErrors,
	asyncErrorWrapper(getAllUsers),
);

/**
 * @swagger
 * /api/v1/admin/users/{id}/role:
 *   put:
 *     summary: Update user role
 *     description: Change user's role between user and admin (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid role or ID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
adminRouter.put(
	"/users/:id/role",
	updateUserRoleValidation,
	handleValidationErrors,
	asyncErrorWrapper(updateUserRole),
);

/**
 * @swagger
 * /api/v1/admin/users/{id}:
 *   delete:
 *     summary: Delete user
 *     description: Delete user and all associated data (cascade delete - sessions, journal entries, media)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User MongoDB ObjectId
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
adminRouter.delete(
	"/users/:id",
	userIdParamValidation,
	handleValidationErrors,
	asyncErrorWrapper(deleteUser),
);

// ==================== VK SEQUENCE MANAGEMENT ====================

/**
 * @swagger
 * /api/v1/admin/sequences:
 *   post:
 *     summary: Create VK sequence
 *     description: Create new Vinyasa Krama system sequence template (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - family
 *               - level
 *               - duration
 *               - structure
 *             properties:
 *               name:
 *                 type: string
 *                 example: Standing Mountain Flow
 *               family:
 *                 type: string
 *                 example: standing_mountain
 *               level:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *               structure:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Sequence created successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       500:
 *         description: Server error
 */
adminRouter.post(
	"/sequences",
	createVKSequenceValidation,
	handleValidationErrors,
	asyncErrorWrapper(createVKSequence),
);

/**
 * @swagger
 * /api/v1/admin/sequences/{id}:
 *   put:
 *     summary: Update VK sequence
 *     description: Update existing Vinyasa Krama sequence (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sequence MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               level:
 *                 type: integer
 *               duration:
 *                 type: integer
 *               structure:
 *                 type: array
 *     responses:
 *       200:
 *         description: Sequence updated successfully
 *       400:
 *         description: Invalid ID or parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       404:
 *         description: Sequence not found
 *       500:
 *         description: Server error
 */
adminRouter.put(
	"/sequences/:id",
	updateVKSequenceValidation,
	handleValidationErrors,
	asyncErrorWrapper(updateVKSequence),
);

/**
 * @swagger
 * /api/v1/admin/sequences/{id}:
 *   delete:
 *     summary: Delete VK sequence
 *     description: Delete Vinyasa Krama sequence (admin only, cannot delete if in use)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sequence MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Sequence deleted successfully
 *       400:
 *         description: Invalid ID or sequence is referenced in active sessions
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       404:
 *         description: Sequence not found
 *       500:
 *         description: Server error
 */
adminRouter.delete(
	"/sequences/:id",
	resourceIdParamValidation,
	handleValidationErrors,
	asyncErrorWrapper(deleteVKSequence),
);

// ==================== POSE MANAGEMENT ====================

/**
 * @swagger
 * /api/v1/admin/poses:
 *   post:
 *     summary: Create pose
 *     description: Create new yoga pose in system (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - difficulty
 *             properties:
 *               name:
 *                 type: string
 *               sanskritName:
 *                 type: string
 *               category:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pose created successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       500:
 *         description: Server error
 */
adminRouter.post(
	"/poses",
	uploadPoseMixed,
	createPoseValidation,
	handleValidationErrors,
	asyncErrorWrapper(createPose),
);

/**
 * @swagger
 * /api/v1/admin/poses/{id}:
 *   put:
 *     summary: Update pose
 *     description: Update yoga pose information (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pose MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *     responses:
 *       200:
 *         description: Pose updated successfully
 *       400:
 *         description: Invalid ID or parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       404:
 *         description: Pose not found
 *       500:
 *         description: Server error
 */
adminRouter.put(
	"/poses/:id",
	uploadPoseMixed,
	updatePoseValidation,
	handleValidationErrors,
	asyncErrorWrapper(updatePose),
);

/**
 * @swagger
 * /api/v1/admin/poses/{id}:
 *   delete:
 *     summary: Delete pose
 *     description: Delete yoga pose and associated media (admin only, cannot delete if in use)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pose MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Pose deleted successfully
 *       400:
 *         description: Invalid ID or pose is referenced in sequences
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       404:
 *         description: Pose not found
 *       500:
 *         description: Server error
 */
adminRouter.delete(
	"/poses/:id",
	resourceIdParamValidation,
	handleValidationErrors,
	asyncErrorWrapper(deletePose),
);

// ==================== BREATHING PATTERN MANAGEMENT ====================

/**
 * @swagger
 * /api/v1/admin/breathing-patterns:
 *   post:
 *     summary: Create breathing pattern
 *     description: Create new breathing pattern in system (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - technique
 *               - difficulty
 *             properties:
 *               name:
 *                 type: string
 *               technique:
 *                 type: string
 *                 enum: [nadishodhana, kapalabhati, bhastrika, ujjayi, bhramari, cooling]
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               duration:
 *                 type: integer
 *                 description: Recommended duration in minutes
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Breathing pattern created successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       500:
 *         description: Server error
 */
adminRouter.post(
	"/breathing-patterns",
	createBreathingPatternValidation,
	handleValidationErrors,
	asyncErrorWrapper(createBreathingPattern),
);

/**
 * @swagger
 * /api/v1/admin/breathing-patterns/{id}:
 *   put:
 *     summary: Update breathing pattern
 *     description: Update breathing pattern information (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pattern MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               technique:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               duration:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Pattern updated successfully
 *       400:
 *         description: Invalid ID or parameters
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       404:
 *         description: Pattern not found
 *       500:
 *         description: Server error
 */
adminRouter.put(
	"/breathing-patterns/:id",
	updateBreathingPatternValidation,
	handleValidationErrors,
	asyncErrorWrapper(updateBreathingPattern),
);

/**
 * @swagger
 * /api/v1/admin/breathing-patterns/{id}:
 *   delete:
 *     summary: Delete breathing pattern
 *     description: Delete breathing pattern (admin only, cannot delete if in use)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pattern MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Pattern deleted successfully
 *       400:
 *         description: Invalid ID or pattern is referenced in sessions
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       404:
 *         description: Pattern not found
 *       500:
 *         description: Server error
 */
adminRouter.delete(
	"/breathing-patterns/:id",
	resourceIdParamValidation,
	handleValidationErrors,
	asyncErrorWrapper(deleteBreathingPattern),
);

// ==================== ANALYTICS ====================

/**
 * @swagger
 * /api/v1/admin/analytics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     description: Retrieve overall platform statistics and analytics (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 activeSessions:
 *                   type: integer
 *                 popularSequences:
 *                   type: array
 *                 sessionTrends:
 *                   type: object
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       500:
 *         description: Server error
 */
adminRouter.get("/analytics/dashboard", asyncErrorWrapper(getDashboardStats));

/**
 * @swagger
 * /api/v1/admin/analytics/users/{userId}:
 *   get:
 *     summary: Get user analytics
 *     description: Get detailed analytics for specific user (admin only)
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User MongoDB ObjectId
 *     responses:
 *       200:
 *         description: User analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 totalSessions:
 *                   type: integer
 *                 journalEntries:
 *                   type: integer
 *                 vkProgression:
 *                   type: object
 *       400:
 *         description: Invalid user ID format
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - user not admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
adminRouter.get(
	"/analytics/users/:userId",
	userIdQueryValidation,
	handleValidationErrors,
	asyncErrorWrapper(getUserAnalytics),
);

module.exports = adminRouter;
