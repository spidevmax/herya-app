const request = require("supertest");
const app = require("../app");
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
		const res = await request(app)
			.get(`${BASE}/me`)
			.set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toHaveProperty("email", "profile@test.com");
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
});

describe("Users — GET /me/stats", () => {
	it("returns stats for the authenticated user", async () => {
		const { token } = await createUser({ email: "stats@test.com" });
		const res = await request(app)
			.get(`${BASE}/me/stats`)
			.set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("totalSessions");
		expect(res.body.data).toHaveProperty("totalMinutes");
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
