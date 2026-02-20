/**
 * Sends a standardized JSON response for the entire API.
 * Keeps success/error responses consistent across controllers.
 *
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (200, 201, 400, 500, etc.)
 * @param {boolean} success - true for success, false for error
 * @param {string} message - Description of the result
 * @param {object|null} data - (optional) Additional payload or error details
 * @returns {object} JSON response
 */

const sendResponse = (res, statusCode, success, message, data = null) => {
	const response = { success, message };

	// Only include "data" if it's meaningful (not null or undefined)
	if (data) response.data = data;

	return res.status(statusCode).json(response);
};

module.exports = { sendResponse };
