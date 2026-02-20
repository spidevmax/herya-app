const jwt = require("jsonwebtoken");

/**
 * Utility function to generate JWT tokens
 *
 * Creates a JSON Web Token containing the user's ID and email.
 * This token is used for subsequent API requests to identify and authenticate the user.
 *
 * The token is signed with a secret key from environment variables (JWT_SECRET)
 * and expires after 24 hours.
 *
 * @param {string} id - User's MongoDB ID (to be included in token payload)
 * @param {string} email - User's email address (to be included in token payload)
 * @returns {string} Signed JWT token
 * @throws {Error} Throws an error if JWT_SECRET environment variable is not defined
 *
 * Token Structure:
 * - Header: Contains algorithm (HS256) and token type (JWT)
 * - Payload: Contains id, email, and expiration time (iat, exp)
 * - Signature: Signed with JWT_SECRET environment variable
 *
 * @example
 * // Generate token after successful login
 * const token = generateToken(user._id, user.email);
 * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * // Expires: 24 hours from generation
 *
 * Security Notes:
 * - Token expires after 24 hours (expiresIn: "1d")
 * - JWT_SECRET must be a strong, random string (minimum 32 characters recommended)
 * - Keep JWT_SECRET in environment variables, never expose it
 * - Tokens should be sent via HTTPS only
 * - Ensure JWT_SECRET is defined before the application starts
 */
const generateToken = (id, email) => {
	if (!process.env.JWT_SECRET) {
		throw new Error(
			"JWT_SECRET environment variable is not defined. Please set it in your .env file.",
		);
	}
	return jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

/**
 * Utility function to verify and decode JWT tokens
 *
 * Validates and decodes a JWT token to extract the user information.
 * Used by the isAuth middleware to verify that incoming requests include a valid token.
 *
 * This function performs cryptographic verification using the JWT_SECRET key
 * to ensure the token has not been tampered with and is still valid (not expired).
 *
 * @param {string} token - The JWT token to verify (typically from Authorization header)
 * @returns {object} Decoded token payload containing { id, email, iat, exp }
 * @throws {Error} Throws an error if:
 *                 - JWT_SECRET is not defined
 *                 - Token is invalid or has been tampered with
 *                 - Token has expired (expiresIn period exceeded)
 *                 - Token is malformed
 *
 * Possible Error Scenarios:
 * - JWT_SECRET not defined: Environment variable is missing
 * - Invalid signature: Token was modified or signed with different secret
 * - Token expired: The expiresIn period (1d) has passed
 * - Malformed token: Token doesn't follow JWT format
 * - Missing or wrong secret: JWT_SECRET doesn't match signing secret
 *
 * @example
 * // Verify token from Authorization header
 * try {
 *   const decoded = verifyToken(token);
 *   console.log(decoded.id);    // User ID
 *   console.log(decoded.email); // User email
 * } catch (error) {
 *   // Token is invalid or expired
 *   console.error("Token verification failed:", error.message);
 * }
 *
 * Typical Decoded Payload:
 * {
 *   id: "507f1f77bcf86cd799439011",
 *   email: "user@example.com",
 *   iat: 1704067200,     // Issued at timestamp
 *   exp: 1704153600      // Expiration timestamp (24h later)
 * }
 */
const verifyToken = (token) => {
	if (!process.env.JWT_SECRET) {
		throw new Error(
			"JWT_SECRET environment variable is not defined. Please set it in your .env file.",
		);
	}
	return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
	generateToken,
	verifyToken,
};
