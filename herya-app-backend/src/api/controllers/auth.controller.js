const User = require("../models/User.model");
const jwt = require("../../utils/jwt");
const bcrypt = require("bcrypt");

/**
 * POST /api/v1/auth/login
 * - Authenticates a user with email and password.
 * - Returns JWT token if successful.
 * - Returns 401 if credentials are invalid.
 */
const login = async (req, res, next) => {
	try {
		const { email, password } = req.body;

		// Validate input
		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required" });
		}

		// Find user by email
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Verify password
		const isPasswordValid = bcrypt.compareSync(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Generate JWT token
		const token = jwt.generateToken(user._id);

		res.status(200).json({
			message: "Login successful",
			token,
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				level: user.level,
			},
		});
	} catch (error) {
		return next(error);
	}
};

/**
 * POST /api/v1/auth/logout
 * - Logs out a user by invalidating the token.
 * - Note: Token invalidation should be handled client-side or with a token blacklist.
 */
const logout = async (req, res, next) => {
	try {
		res.status(200).json({ message: "Logout successful" });
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/auth/verify
 * - Verifies if the JWT token is valid.
 * - Returns user info if token is valid.
 * - Returns 401 if token is invalid.
 */
const verifyToken = async (req, res, next) => {
	try {
		// Token is already validated by auth middleware
		const userId = req.user.id;
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		res.status(200).json({
			message: "Token is valid",
			user: {
				id: user._id,
				name: user.name,
				email: user.email,
				level: user.level,
			},
		});
	} catch (error) {
		return next(error);
	}
};

module.exports = { login, logout, verifyToken };
