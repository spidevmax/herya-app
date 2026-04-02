const {
	register,
	login,
	me,
	logout,
	googleAuthStart,
	googleAuthCallback,
	requestPasswordReset,
	resetPassword,
} = require("../controllers/auth.controller");
const {
	registerValidations,
	loginValidations,
	forgotPasswordValidations,
	resetPasswordValidations,
} = require("../validations/auth.validations");
const {
	handleValidationErrors,
} = require("../../middlewares/validation.middleware");
const { uploadUserImage } = require("../../middlewares/upload/user.upload");
const {
	authenticateToken,
} = require("../../middlewares/authorization.middleware");

const authRouter = require("express").Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: Create a new user account. Returns a JWT token for immediate authentication.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass123
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: John Doe
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [increase_flexibility, build_strength, reduce_stress, improve_balance, therapeutic_healing, deepen_practice, meditation_focus, breath_awareness]
 *                 example: ["reduce_stress", "improve_balance"]
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional profile image (jpg, png, webp, gif)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT authentication token (expires in 1 day)
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       description: Newly created user profile (password excluded)
 *       400:
 *         description: Validation error or email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
authRouter.post(
	"/register",
	uploadUserImage.single("profileImage"),
	registerValidations,
	handleValidationErrors,
	register,
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     description: Login with email and password to receive JWT authentication token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT authentication token (expires in 1 day, use in Authorization header)
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       description: Authenticated user profile (password excluded)
 *       400:
 *         description: Validation error (missing/invalid fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
authRouter.post("/login", loginValidations, handleValidationErrors, login);
authRouter.post(
	"/forgot-password",
	forgotPasswordValidations,
	handleValidationErrors,
	requestPasswordReset,
);
authRouter.post(
	"/reset-password",
	resetPasswordValidations,
	handleValidationErrors,
	resetPassword,
);

authRouter.get("/google", googleAuthStart);
authRouter.get("/google/callback", googleAuthCallback);

authRouter.get("/me", authenticateToken(), me);
authRouter.post("/logout", authenticateToken(), logout);

module.exports = authRouter;
