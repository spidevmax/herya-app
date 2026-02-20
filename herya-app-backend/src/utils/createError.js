/**
 * Utility function to create standardized error objects
 *
 * Creates a new Error instance with a custom HTTP status code attached.
 * This allows errors to carry both a message and an HTTP status code,
 * making it easier for the global error handler to respond with appropriate status codes.
 *
 * @param {number} status - HTTP status code (e.g., 400, 401, 404, 500)
 * @param {string} message - Error message describing what went wrong
 * @returns {Error} Error object with status property attached
 *
 * @example
 * // Creating a 404 Not Found error
 * const error = createError(404, "User not found");
 * // error.status === 404
 * // error.message === "User not found"
 *
 * @example
 * // Creating a 400 Bad Request error
 * const error = createError(400, "Invalid email address");
 * throw error; // Will be caught by error handler
 */
const createError = (status, message) => {
	const error = new Error(message);
	error.status = status;
	return error;
};

module.exports = { createError };
