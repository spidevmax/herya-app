/**
 * Utility function that wraps async route handlers to catch exceptions
 *
 * Express does not automatically catch exceptions thrown inside async/await functions.
 * This wrapper converts any thrown errors into promises and passes them to the Express
 * error handler middleware, ensuring consistent error handling across the application.
 *
 * How it works:
 * 1. Accepts an async route handler function
 * 2. Returns a middleware function that wraps the handler
 * 3. Converts the handler's return value to a Promise
 * 4. If the handler throws or rejects → catches and passes to Express error handler (next)
 * 5. If the handler succeeds → executes normally
 *
 * @param {Function} fn - Async route handler function(req, res, next)
 * @returns {Function} Express middleware that safely handles async errors
 *
 * Error Handling:
 * - Catches all thrown errors in async handlers
 * - Catches all promise rejections
 * - Passes errors to the global error handler via next(error)
 * - Allows createError(status, message) to be thrown and handled properly
 *
 * @example
 * // Without asyncErrorWrapper (NOT RECOMMENDED - errors not caught)
 * router.get("/user/:id", async (req, res, next) => {
 *   const user = await User.findById(req.params.id); // Error not caught
 *   res.json(user);
 * });
 *
 * @example
 * // With asyncErrorWrapper (RECOMMENDED - all errors caught)
 * router.get("/user/:id", asyncErrorWrapper(async (req, res, next) => {
 *   const user = await User.findById(req.params.id); // Error caught and passed to handler
 *   sendResponse(res, 200, true, "User found", user);
 * }));
 *
 * @example
 * // Throwing custom errors inside wrapped handler
 * router.post("/users", asyncErrorWrapper(async (req, res, next) => {
 *   const existingUser = await User.findOne({ email: req.body.email });
 *   if (existingUser) {
 *     throw createError(400, "User already exists"); // Caught and sent to error handler
 *   }
 *   // ... create user code
 * }));
 *
 * Usage Pattern in Routes:
 * - Wrap every async route handler with asyncErrorWrapper()
 * - All thrown errors (including createError()) will be caught
 * - Errors passed to global error handler in index.js
 * - Status codes from createError are used in error responses
 *
 * Common Patterns:
 * - Routes with validations → error handler sends 400
 * - Routes with database queries → error handler sends 500 if DB fails
 * - Routes with createError(statusCode, message) → error handler sends correct status
 *
 * Security Notes:
 * - Errors are passed to ES global handler, not logged directly
 * - Global error handler decides what to send to client
 * - Production: logs errors, sends safe messages
 * - Development: logs full stack traces
 *
 * Database Operations:
 * - MongoDB errors are caught and converted to 500 responses
 * - Validation errors go through validation middleware separately
 * - Both paths ultimately use error handler for consistency
 */
const asyncErrorWrapper = (fn) => {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};

module.exports = asyncErrorWrapper;
