const { register, login } = require("../controllers/auth.controller");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");
const { registerValidations, loginValidations } = require("../validations/auth.validations");
const { handleValidationErrors } = require("../../middlewares/validation.middleware");
const { uploadUserImage } = require("../../middlewares/upload/user.upload");

const authRouter = require("express").Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user account
 *     description: Create a new user account with profile image, email, password, name, and preferences
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
 *                 minLength: 6
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: John Doe
 *               goals:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["flexibility", "strength"]
 *               preferredDuration:
 *                 type: integer
 *                 example: 30
 *               experienceLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: beginner
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: User profile image (jpg, png, webp, gif)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *       400:
 *         description: Invalid input or user already exists
 *       500:
 *         description: Server error
 */
authRouter.post(
	"/register",
	uploadUserImage.single("profileImage"),
	registerValidations,
	handleValidationErrors,
	asyncErrorWrapper(register),
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
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT authentication token (use in Authorization header)
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid email or password
 *       401:
 *         description: Unauthorized - credentials incorrect
 *       500:
 *         description: Server error
 */
authRouter.post("/login", loginValidations, handleValidationErrors, asyncErrorWrapper(login));

module.exports = authRouter;
