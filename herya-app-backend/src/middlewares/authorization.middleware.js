const User = require("../api/models/User.model");
const { verifyToken } = require("../utils/token");
// Note: createError is available in utils but not used in these middleware functions
// Error responses are created inline to maintain consistency with existing patterns

/**
 * Middleware: authenticateToken
 * ---------------------------
 * Verifies JWT token in Authorization header and authenticates user.
 *
 * JWT Verification Flow:
 * 1. Extracts Bearer token from Authorization header (format: "Bearer <token>")
 * 2. Verifies token using JWT (signature validation and expiration check)
 * 3. Decodes token to get user ID and email
 * 4. Finds user from token payload in database
 * 5. Checks if user still exists and is active
 * 6. Optionally validates user role against allowedRoles if provided
 * 7. Attaches user object to req.user for downstream middlewares and controllers
 *
 * Role-Based Access Control (RBAC):
 * - Pass allowedRoles array to restrict access by user role
 * - If user.role not in allowedRoles, returns 403 Forbidden
 * - Empty array (default) means all authenticated users are allowed
 * - Works as a filter: allows only specified roles
 *
 * Header Format:
 * - Required: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * - Token must be valid JWT signed with JWT_SECRET
 * - Token should not be expired (expiresIn: "1d")
 *
 * Error Responses:
 * - 401: No token provided in Authorization header
 * - 401: Invalid token signature or token has been tampered with
 * - 401: Token has expired
 * - 401: User found in token payload but not in database
 * - 403: User lacks required role (if allowedRoles specified)
 *
 * @param {string[]} allowedRoles - Array of roles allowed (e.g., ['user', 'admin']). Empty array = all authenticated users allowed
 * @returns {Function} Express middleware function
 *
 * User Object (req.user):
 * - Contains full User document from MongoDB
 * - Includes: _id, email, role, profile info, settings, etc.
 * - Available in all downstream handlers
 * - Safe to use without additional database queries for user info
 *
 * @example
 * // Require authentication (any role allowed)
 * router.get("/profile", authenticateToken(), userController.getProfile);
 *
 * @example
 * // Require authentication + specific roles
 * router.delete("/users/:id", authenticateToken(['admin']), adminController.deleteUser);
 *
 * @example
 * // Multiple allowed roles
 * router.post("/moderate", authenticateToken(['admin', 'moderator']), reportController.resolve);
 *
 * Usage Notes:
 * - Typically used at route level or router level with router.use()
 * - token.js verifyToken() throws on invalid/expired tokens (caught by try-catch)
 * - Database lookup ensures user still exists (prevents deleted user tokens)
 * - Setup in routes: const { authenticateToken } = require("../../middlewares/authorization.middleware");
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
 * - MUST be used AFTER authenticateToken() middleware
 * - Assumes req.user is already populated with authenticated user data
 * - Will fail if used alone without prior authentication
 *
 * Authorization Check:
 * - Allows request to proceed only if user.role === 'admin'
 * - Returns 403 Forbidden if user is not admin
 * - No database query needed - uses req.user from authenticateToken
 *
 * Error Response:
 * - 403: User is not an admin
 *
 * Usage Pattern:
 * - Chain after authenticateToken on routes that need admin-only access
 * - Can also pass allowedRoles: ['admin'] to authenticateToken instead
 * - Use isAdmin when you want explicit separate role check
 * - Use authenticateToken(['admin']) for more concise syntax
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * // Protect admin-only endpoints
 * router.delete("/users/:id", authenticateToken(), isAdmin, controller.deleteUser);
 * router.post("/admin/settings", authenticateToken(), isAdmin, controller.updateSettings);
 * router.get("/admin/analytics", authenticateToken(), isAdmin, controller.getDashboard);
 *
 * @example
 * // Alternative: use authenticateToken with role directly (recommended for routes)
 * router.delete("/users/:id", authenticateToken(['admin']), controller.deleteUser);
 *
 * When to Use:
 * - Use isAdmin: When multiple permission checks on same route (admin OR moderator)
 * - Use authenticateToken(['admin']): Simpler syntax for single role requirement
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
 * - Resource must be loaded into req.resource before this middleware
 * - Field name should match resource owner reference in schema
 *
 * Ownership Verification:
 * - Allows admins to access ANY resource (bypasses ownership check)
 * - Allows users to access ONLY their own resources
 * - Compares user._id with resource[fieldName]
 * - MongoID comparison uses .toString() for proper equality checking
 * - Useful for user-created content: journal entries, sessions, etc.
 *
 * Error Response:
 * - 403: User is neither owner nor admin
 *
 * Field Name Mapping:
 * - Default field: 'user' (most common for user-created content)
 * - Examples: 'author' (posts), 'creator' (sequences), 'owner' (resources)
 * - Match the exact field name in your resource schema
 *
 * @param {string} fieldName - Property name in resource that contains owner ID (default: 'user')
 * @returns {Function} Express middleware function
 *
 * Resource Loading Pattern:
 * - Usually used with route parameter middleware to load resource into req.resource
 * - Example flow:
 *   1. Route: PUT /journal/:id
 *   2. Middleware: Load journal into req.resource by :id
 *   3. Middleware: isOwnerOrAdmin('user') - verify req.user is owner
 *   4. Controller: Update the resource
 *
 * @example
 * // Check ownership of user profile
 * router.put(
 *   "/users/:id",
 *   authenticateToken(),
 *   loadUserMiddleware, // loads user into req.resource
 *   isOwnerOrAdmin('user'),
 *   controller.updateProfile
 * );
 *
 * @example
 * // Check ownership of journal entry
 * router.delete(
 *   "/journals/:id",
 *   authenticateToken(),
 *   loadJournalMiddleware, // loads journal into req.resource
 *   isOwnerOrAdmin('author'),
 *   controller.deleteJournal
 * );
 *
 * @example
 * // Check ownership with custom field
 * router.put(
 *   "/sequences/:id",
 *   authenticateToken(),
 *   loadSequenceMiddleware,
 *   isOwnerOrAdmin('creator'),
 *   controller.updateSequence
 * );
 *
 * Security Notes:
 * - Always place after authentication middleware
 * - Admin bypass is intentional - allows admins to moderate content
 * - ObjectId comparison handles string vs ObjectId types properly
 * - Prevents cross-user access to private resources
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

/**
 * Middleware: optionalAuth
 * -----------------------
 * Optionally authenticates the request if a Bearer token is present.
 * Unlike authenticateToken(), this never rejects the request — it simply
 * populates req.user when a valid token is provided and skips silently
 * when no token (or an invalid one) is given.
 *
 * Use this on public routes that provide enhanced data for authenticated
 * users (e.g., "unlocked" sequence filter, "isAccessible" flags) while
 * still serving anonymous users normally.
 *
 * @example
 * // Public route that shows extra data for authenticated users
 * router.get("/sequences", optionalAuth, asyncErrorWrapper(getSequences));
 */
const optionalAuth = async (req, res, next) => {
	try {
		const token = req.headers.authorization?.replace("Bearer ", "");
		if (!token) return next();

		const decoded = verifyToken(token);
		const user = await User.findById(decoded.id);
		if (user) req.user = user;
	} catch {
		// Invalid / expired token — proceed as anonymous
	}
	next();
};

module.exports = { authenticateToken, isAdmin, isOwnerOrAdmin, optionalAuth };
