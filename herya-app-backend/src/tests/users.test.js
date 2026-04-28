const request = require("supertest");
const app = require("../app");
const User = require("../api/models/User.model");
const { createUser } = require("./helpers");

const BASE = "/api/v1/users";

describe("Users — GET /me", () => {
	it("returns 401 without a token", async () => {
		const res = await request(app).get(`${BASE}/me`);
		expect(res.status).toBe(401);
	});

	it("returns the authenticated user's profile", async () => {
		const { token } = await createUser({
			name: "Profile User",
			email: "profile@test.com",
		});
		const res = await request(app).get(`${BASE}/me`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toHaveProperty("email", "profile@test.com");
	});

	it("allows tutor role to access standard user profile endpoint", async () => {
		const { token } = await createUser({
			name: "Tutor Profile",
			email: "tutor-profile@test.com",
			role: "tutor",
		});

		const res = await request(app).get(`${BASE}/me`).set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toHaveProperty("role", "tutor");
		expect(res.body.data).toHaveProperty("email", "tutor-profile@test.com");
	});

	it("does not include vkProgression in the response", async () => {
		const { token } = await createUser({ email: "no-vk@test.com" });
		const res = await request(app).get(`${BASE}/me`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.data).not.toHaveProperty("vkProgression");
	});

	it("does not include password in the response", async () => {
		const { token } = await createUser({ email: "no-pwd@test.com" });
		const res = await request(app).get(`${BASE}/me`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.data).not.toHaveProperty("password");
	});

	it("includes bestStreak in the response", async () => {
		const { token } = await createUser({ email: "streak@test.com" });
		const res = await request(app).get(`${BASE}/me`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("bestStreak");
	});
});

describe("Users — PUT /me", () => {
	it("updates the user's name", async () => {
		const { token } = await createUser({
			name: "Old Name",
			email: "update@test.com",
		});
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "New Name" });
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("name", "New Name");
	});

	it("updates low stimulation preference", async () => {
		const { token } = await createUser({ email: "prefs@test.com" });
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				preferences: {
					lowStimMode: true,
				},
			});

		expect(res.status).toBe(200);
		expect(res.body.data.preferences).toHaveProperty("lowStimMode", true);
	});

	it("updates safety anchors preference", async () => {
		const { token } = await createUser({ email: "anchors@test.com" });
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				preferences: {
					safetyAnchors: {
						phrase: "We breathe together",
						bodyCue: "Feet on floor",
					},
				},
			});

		expect(res.status).toBe(200);
		expect(res.body.data.preferences).toHaveProperty("safetyAnchors");
		expect(res.body.data.preferences.safetyAnchors).toEqual({
			phrase: "We breathe together",
			bodyCue: "Feet on floor",
		});
	});

	it("does not include vkProgression in the update response", async () => {
		const { token } = await createUser({ email: "update-vk@test.com" });
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "VK Check" });
		expect(res.status).toBe(200);
		expect(res.body.data).not.toHaveProperty("vkProgression");
	});

	it("rejects attempt to change role", async () => {
		const { token } = await createUser({ email: "role-change@test.com" });
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "admin" });
		expect(res.status).toBe(403);
	});

	it("rejects attempt to change password via profile update", async () => {
		const { token } = await createUser({ email: "pw-change@test.com" });
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({ password: "NewPass123" });
		expect(res.status).toBe(403);
	});

	it("rejects attempt to change vkProgression", async () => {
		const { token } = await createUser({ email: "vk-change@test.com" });
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({ vkProgression: { completedSequences: [] } });
		expect(res.status).toBe(403);
	});

	it("returns 400 for invalid email format", async () => {
		const { token } = await createUser({ email: "valid-email@test.com" });
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({ email: "not-an-email" });
		expect(res.status).toBe(400);
	});

	it("returns 400 for name too short", async () => {
		const { token } = await createUser({ email: "short-name@test.com" });
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "A" });
		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid goal value", async () => {
		const { token } = await createUser({ email: "bad-goal@test.com" });
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({ goals: ["invalid_goal"] });
		expect(res.status).toBe(400);
	});

	it("returns 400 when email is already taken", async () => {
		await createUser({ email: "taken@test.com" });
		const { token } = await createUser({ email: "other@test.com" });
		const res = await request(app)
			.put(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`)
			.send({ email: "taken@test.com" });
		expect(res.status).toBe(400);
	});
});

describe("Users — GET /me/stats", () => {
	it("returns stats for the authenticated user", async () => {
		const { token } = await createUser({ email: "stats@test.com" });
		const res = await request(app).get(`${BASE}/me/stats`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("totalSessions");
		expect(res.body.data).toHaveProperty("totalMinutes");
		expect(res.body.data).toHaveProperty("bestStreak");
	});
});

describe("Users — PUT /me/change-password", () => {
	it("changes password successfully", async () => {
		const { token } = await createUser({
			email: "changepass@test.com",
			password: "OldPass123",
		});
		const res = await request(app)
			.put(`${BASE}/change-password`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				currentPassword: "OldPass123",
				newPassword: "NewPass456",
				confirmPassword: "NewPass456",
			});
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});

	it("returns 401 when current password is wrong", async () => {
		const { token } = await createUser({
			email: "wrongpass@test.com",
			password: "RealPass123",
		});
		const res = await request(app)
			.put(`${BASE}/change-password`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				currentPassword: "WrongPass999",
				newPassword: "NewPass456",
				confirmPassword: "NewPass456",
			});
		expect(res.status).toBe(401);
	});
});

describe("Users — DELETE /me", () => {
	it("deletes the account and all associated data", async () => {
		const { token, user } = await createUser({ email: "delete-me@test.com" });

		const res = await request(app).delete(`${BASE}/me`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);

		// Verify user no longer exists in the database
		const found = await User.findById(user._id);
		expect(found).toBeNull();
	});

	it("returns 401 without a token", async () => {
		const res = await request(app).delete(`${BASE}/me`);
		expect(res.status).toBe(401);
	});
});
