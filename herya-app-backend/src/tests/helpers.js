const request = require("supertest");
const app = require("../app");
const User = require("../api/models/User.model");

/**
 * Register a user and return { user, token }
 */
const createUser = async (overrides = {}) => {
	const defaults = {
		name: "Test User",
		email: `test-${Date.now()}@example.com`,
		password: "SecurePass123",
		role: "user",
	};
	const data = { ...defaults, ...overrides };
	const res = await request(app).post("/api/v1/auth/register").send(data);
	return res.body.data;
};

/**
 * Returns a minimal valid Pose object for direct model insertion.
 */
const poseFactory = (overrides = {}) => ({
	name: "Test Pose",
	romanizationName: "Tadasana",
	iastName: "Tāḍāsana",
	sanskritName: "ताड़ासन",
	vkCategory: { primary: "standing_mountain" },
	difficulty: "beginner",
	...overrides,
});

/**
 * Create a session via the API and return the session document.
 * Requires a valid auth token.
 */
const createSession = async (token, overrides = {}) => {
	const defaults = { sessionType: "meditation", duration: 30 };
	const res = await request(app)
		.post("/api/v1/sessions")
		.set("Authorization", `Bearer ${token}`)
		.send({ ...defaults, ...overrides });
	return res.body.data;
};

/**
 * Register a user, promote to admin, and return { user, token }
 */
const createAdmin = async (overrides = {}) => {
	const data = await createUser(overrides);
	await User.findByIdAndUpdate(data.user._id, { role: "admin" });
	return data;
};

module.exports = { createUser, createAdmin, poseFactory, createSession };
