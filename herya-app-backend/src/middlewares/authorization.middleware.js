const User = require("../api/models/User.model");
const { verifyToken } = require("../utils/token");
// Note: createError is available in utils but not used in these middleware functions
// Error responses are created inline to maintain consistency with existing patterns

/**
 * Middleware: authenticateToken
 * ---------------------------
 * Verifies JWT token in Authorization header and authenticates user.
 *
 * Functionality:
 * 1. Extracts Bearer token from Authorization header
 * 2. Verifies token using JWT
 * 3. Finds user from token payload
 * 4. Checks if user still exists in database
 * 5. Optionally validates user role against allowedRoles
 * 6. Attaches user object to req.user for downstream middlewares
 *
 * Role-Based Access Control:
 * - Pass allowedRoles array to restrict access by user role
 * - If user.role not in allowedRoles, returns 403 Forbidden
 * - Empty array means all authenticated users are allowed
 *
 * Error Responses:
 * - 401: No token provided
 * - 401: Invalid token or user not found
 * - 401: Token expired
 * - 403: User lacks required role
 *
 * @param {string[]} allowedRoles - Array of roles allowed (e.g., ['user', 'admin'])
 * @returns {Function} Express middleware function
 *
 * @example
 * // Require authentication (any role)
 * router.get("/profile", authenticateToken(), userController.getProfile);
 *
 * @example
 * // Require authentication + admin role
 * router.delete("/users/:id", authenticateToken(['admin']), adminController.deleteUser);
 */
const authenticateToken = (allowedRoles = []) => {
	return async (req, res, next) => {
		try {
			const token = req.headers.authorization?.replace("Bearer ", "");
			if (!token) {
				return res
					.status(401)
					.json({ success: false, message: "Unauthorized: No token provided" });
			}

			const decoded = verifyToken(token);
			const user = await User.findById(decoded.id);
			if (!user) {
				return res
					.status(401)
					.json({ success: false, message: "Invalid token or user not found" });
			}

			req.user = user;

			// Check roles if specified
			if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
				return res.status(403).json({
					success: false,
					message: "Access denied: Insufficient permissions",
				});
			}

			next();
		} catch {
			return res
				.status(401)
				.json({ success: false, message: "Invalid or expired token" });
		}
	};
};

/**
 * Middleware: isAdmin
 * ------------------
 * Verifies that authenticated user has 'admin' role.
 *
 * Prerequisites:
 * - Must be used AFTER authenticateToken() middleware
 * - Assumes req.user is already populated with authenticated user
 *
 * Behavior:
 * - Allows request to proceed only if user.role === 'admin'
 * - Returns 403 Forbidden if user is not admin
 *
 * Error Response:
 * - 403: User is not an admin
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Protect admin endpoints
 * router.delete("/users/:id", authenticateToken(), isAdmin, controller.deleteUser);
 * router.post("/admin/settings", authenticateToken(), isAdmin, controller.updateSettings);
 */
const isAdmin = (req, res, next) => {
	if (!req.user || req.user.role !== "admin") {
		return res
			.status(403)
			.json({ success: false, message: "Access denied: Admin only" });
	}
	next();
};

/**
 * Middleware: isOwnerOrAdmin
 * -------------------------
 * Verifies that user is either the resource owner or an admin.
 *
 * Prerequisites:
 * - Must be used AFTER authenticateToken() middleware
 * - Resource must be loaded into req.resource
 * - Field name should match resource owner reference (default: 'user')
 *
 * Behavior:
 * - Allows admins to access any resource
 * - Allows users to access only their own resources
 * - Compares user._id with resource[fieldName]
 *
 * Error Response:
 * - 403: User is neither owner nor admin
 *
 * @param {string} fieldName - Property name in resource that contains owner ID (default: 'user')
 * @returns {Function} Express middleware function
 *
 * @example
 * // Check ownership of user profile
 * router.put("/users/:id", authenticateToken(), isOwnerOrAdmin('user'), controller.updateProfile);
 *
 * @example
 * // Check ownership of journal entry
 * router.delete("/journals/:id", authenticateToken(), isOwnerOrAdmin('author'), controller.deleteJournal);
 */
const isOwnerOrAdmin = (fieldName = "user") => {
	return (req, res, next) => {
		const resourceOwnerId = req.resource?.[fieldName]?.toString();
		const userId = req.user._id.toString();
		const userIsAdmin = req.user.role === "admin";

		if (!userIsAdmin && resourceOwnerId !== userId) {
			return res.status(403).json({
				success: false,
				message: "Access denied: Only owner or admin can perform this action",
			});
		}
		next();
	};
};

module.exports = { authenticateToken, isAdmin, isOwnerOrAdmin };
