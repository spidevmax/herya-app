/**
 * Wrapper for async route handlers
 * Catches unhandled promise rejections and passes them to Express error handler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware
 */
const asyncErrorWrapper = (fn) => {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};

module.exports = asyncErrorWrapper;
