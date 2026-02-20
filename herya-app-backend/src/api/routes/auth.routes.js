const { registerUser, loginUser } = require("../controllers/auth.controller");
const { uploadUserImage } = require("../../middlewares/upload/user.upload");
const {
	handleValidationErrors,
} = require("../../middlewares/validation.middleware");
const {
	registerValidations,
	loginValidations,
} = require("../validations/auth.validations");

const authRouter = require("express").Router();

/**
 * POST /register
 * @description Register a new user account
 *
 * Request Body:
 * - name (string, required): User's full name
 * - email (string, required): User's email address (must be unique)
 * - password (string, required): Password (minimum 8 characters)
 * - profileImage (file, optional): Profile picture upload
 *
 * Middleware Chain:
 * 1. uploadUserImage.single("profileImage") - Handles single image upload to Cloudinary
 * 2. registerValidations - Validates request data
 * 3. handleValidationErrors - Catches and formats validation errors
 * 4. registerUser - Creates user and returns token
 *
 * Response Success (201):
 * {
 *   success: true,
 *   message: "User registered successfully",
 *   data: {
 *     user: { _id, name, email, profileImageUrl, vkProgression, ... },
 *     token: "jwt_token_string"
 *   }
 * }
 *
 * Response Errors:
 * - 400: Missing required fields, password too short, email already exists
 * - 500: Database or server error
 *
 * Example Usage:
 * POST /api/v1/auth/register
 * Content-Type: multipart/form-data
 * {
 *   name: "John Yoga",
 *   email: "john@example.com",
 *   password: "SecurePass123",
 *   profileImage: <file>
 * }
 */
authRouter.post(
	"/register",
	uploadUserImage.single("profileImage"),
	registerValidations,
	handleValidationErrors,
	registerUser,
);

/**
 * POST /login
 * @description Authenticate user and return JWT token
 *
 * Request Body:
 * - email (string, required): User's email address
 * - password (string, required): User's password
 *
 * Middleware Chain:
 * 1. loginValidations - Validates email and password presence
 * 2. handleValidationErrors - Catches and formats validation errors
 * 3. loginUser - Authenticates and generates token
 *
 * Response Success (200):
 * {
 *   success: true,
 *   message: "Login successful",
 *   data: {
 *     user: { _id, name, email, profileImageUrl, vkProgression, ... },
 *     token: "jwt_token_string"
 *   }
 * }
 *
 * Response Errors:
 * - 400: Missing email or password
 * - 404: User not found
 * - 401: Invalid password
 * - 500: Server error
 *
 * Example Usage:
 * POST /api/v1/auth/login
 * Content-Type: application/json
 * {
 *   email: "john@example.com",
 *   password: "SecurePass123"
 * }
 *
 * Note:
 * - Token should be stored in httpOnly cookie or secure storage (localStorage)
 * - Include token in Authorization header for authenticated requests: "Bearer <token>"
 */
authRouter.post("/login", loginValidations, handleValidationErrors, loginUser);

module.exports = authRouter;
