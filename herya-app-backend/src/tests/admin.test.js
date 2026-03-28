const request = require("supertest");
const app = require("../app");
const Pose = require("../api/models/Pose.model");
const BreathingPattern = require("../api/models/BreathingPattern.model");
const VKSequence = require("../api/models/VinyasaKramaSequence.model");
const { createUser, createAdmin, poseFactory } = require("./helpers");

const BASE = "/api/v1/admin";

// Sent as JSON — multer skips non-multipart requests, express.json() parses it
const POSE_PAYLOAD = {
	name: "Mountain Pose",
	romanizationName: "Tadasana",
	iastName: "Tāḍāsana",
	sanskritName: "ताड़ासन",
	vkCategory: { primary: "standing_mountain" },
	difficulty: "beginner",
};

const BREATHING_PAYLOAD = {
	romanizationName: "Ujjayi",
	iastName: "Ujjāyī",
	sanskritName: "उज्जयी",
	description: "Ocean breath technique",
	difficulty: "beginner",
	energyEffect: "calming",
};

const VK_SEQUENCE_PAYLOAD = {
	sanskritName: "ताडासन परिवार स्तर १",
	englishName: "Tadasana Family Level 1",
	family: "tadasana",
	level: 1,
	difficulty: "beginner",
	therapeuticFocus: { primaryBenefit: "Foundation and balance" },
};

// ==================== AUTHORIZATION ====================

describe("Admin — Authorization", () => {
	it("returns 401 on all routes without a token", async () => {
		const routes = [
			() => request(app).get(`${BASE}/users`),
			() => request(app).put(`${BASE}/users/000000000000000000000000/role`).send({ role: "user" }),
			() => request(app).delete(`${BASE}/users/000000000000000000000000`),
			() => request(app).post(`${BASE}/poses`),
			() => request(app).post(`${BASE}/breathing-patterns`),
			() => request(app).post(`${BASE}/sequences`),
			() => request(app).get(`${BASE}/analytics/dashboard`),
		];
		for (const route of routes) {
			const res = await route();
			expect(res.status).toBe(401);
		}
	});

	it("returns 403 when a regular user tries to access admin routes", async () => {
		const { token } = await createUser({ email: "regular@test.com" });
		const res = await request(app)
			.get(`${BASE}/users`)
			.set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(403);
	});
});

// ==================== USER MANAGEMENT ====================

describe("Admin — GET /users", () => {
	it("returns all users with pagination", async () => {
		const { token } = await createAdmin({ email: "admin-list@test.com" });
		await createUser({ email: "user1@test.com" });
		await createUser({ email: "user2@test.com" });

		const res = await request(app)
			.get(`${BASE}/users`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data.users)).toBe(true);
		expect(res.body.data.users.length).toBeGreaterThanOrEqual(3);
		expect(res.body.data.pagination).toHaveProperty("total");
	});

	it("filters users by role", async () => {
		const { token } = await createAdmin({ email: "admin-filter@test.com" });

		const res = await request(app)
			.get(`${BASE}/users?role=admin`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		res.body.data.users.forEach((u) => { expect(u.role).toBe("admin"); });
	});

	it("searches users by name", async () => {
		const { token } = await createAdmin({ email: "admin-search@test.com" });
		await createUser({ name: "UniqueNameXYZ", email: "unique-xyz@test.com" });

		const res = await request(app)
			.get(`${BASE}/users?search=UniqueNameXYZ`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data.users.length).toBeGreaterThan(0);
		expect(res.body.data.users[0].name).toBe("UniqueNameXYZ");
	});

	it("returns 400 for an invalid role filter", async () => {
		const { token } = await createAdmin({ email: "admin-badrole@test.com" });

		const res = await request(app)
			.get(`${BASE}/users?role=superadmin`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(400);
	});
});

describe("Admin — PUT /users/:id/role", () => {
	it("promotes a user to admin", async () => {
		const { token } = await createAdmin({ email: "admin-promote@test.com" });
		const { user } = await createUser({ email: "to-promote@test.com" });

		const res = await request(app)
			.put(`${BASE}/users/${user._id}/role`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "admin" });

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("role", "admin");
	});

	it("demotes an admin to user", async () => {
		const { token } = await createAdmin({ email: "admin-demote@test.com" });
		const { user } = await createAdmin({ email: "to-demote@test.com" });

		const res = await request(app)
			.put(`${BASE}/users/${user._id}/role`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "user" });

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("role", "user");
	});

	it("returns 400 for an invalid role value", async () => {
		const { token } = await createAdmin({ email: "admin-invalidrole@test.com" });
		const { user } = await createUser({ email: "target-invalid@test.com" });

		const res = await request(app)
			.put(`${BASE}/users/${user._id}/role`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "superuser" });

		expect(res.status).toBe(400);
	});

	it("returns 404 for a non-existent user", async () => {
		const { token } = await createAdmin({ email: "admin-404role@test.com" });

		const res = await request(app)
			.put(`${BASE}/users/000000000000000000000000/role`)
			.set("Authorization", `Bearer ${token}`)
			.send({ role: "admin" });

		expect(res.status).toBe(404);
	});
});

describe("Admin — DELETE /users/:id", () => {
	it("deletes a user and returns 200", async () => {
		const { token } = await createAdmin({ email: "admin-delete@test.com" });
		const { user } = await createUser({ email: "to-delete@test.com" });

		const res = await request(app)
			.delete(`${BASE}/users/${user._id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});

	it("returns 404 for a non-existent user", async () => {
		const { token } = await createAdmin({ email: "admin-deletenotfound@test.com" });

		const res = await request(app)
			.delete(`${BASE}/users/000000000000000000000000`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(404);
	});
});

// ==================== POSE MANAGEMENT ====================

describe("Admin — POST /poses", () => {
	it("creates a pose and returns 201", async () => {
		const { token } = await createAdmin({ email: "admin-createpose@test.com" });

		const res = await request(app)
			.post(`${BASE}/poses`)
			.set("Authorization", `Bearer ${token}`)
			.send(POSE_PAYLOAD);

		expect(res.status).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toHaveProperty("name", "Mountain Pose");
		expect(res.body.data).toHaveProperty("isSystemPose", true);
	});

	it("returns 400 when required fields are missing", async () => {
		const { token } = await createAdmin({ email: "admin-badpose@test.com" });

		const res = await request(app)
			.post(`${BASE}/poses`)
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "Incomplete Pose" });

		expect(res.status).toBe(400);
	});
});

describe("Admin — PUT /poses/:id", () => {
	it("updates a pose's difficulty", async () => {
		const { token } = await createAdmin({ email: "admin-updatepose@test.com" });
		const pose = await Pose.create(poseFactory({ name: "Update Me" }));

		const res = await request(app)
			.put(`${BASE}/poses/${pose._id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ difficulty: "advanced" });

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("difficulty", "advanced");
	});

	it("returns 404 for a non-existent pose", async () => {
		const { token } = await createAdmin({ email: "admin-updatepose404@test.com" });

		const res = await request(app)
			.put(`${BASE}/poses/000000000000000000000000`)
			.set("Authorization", `Bearer ${token}`)
			.send({ difficulty: "advanced" });

		expect(res.status).toBe(404);
	});
});

describe("Admin — DELETE /poses/:id", () => {
	it("deletes a pose and returns 200", async () => {
		const { token } = await createAdmin({ email: "admin-deletepose@test.com" });
		const pose = await Pose.create(poseFactory({ name: "Delete Me" }));

		const res = await request(app)
			.delete(`${BASE}/poses/${pose._id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});

	it("returns 400 when the pose is referenced in a sequence", async () => {
		const { token } = await createAdmin({ email: "admin-poseinuse@test.com" });
		const pose = await Pose.create(poseFactory({ name: "In Use Pose" }));

		await VKSequence.create({
			...VK_SEQUENCE_PAYLOAD,
			sanskritName: "Ref Seq",
			englishName: "Reference Sequence",
			isSystemSequence: true,
			structure: {
				corePoses: [{ pose: pose._id, order: 1, breaths: 5 }],
			},
		});

		const res = await request(app)
			.delete(`${BASE}/poses/${pose._id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(400);
	});

	it("returns 404 for a non-existent pose", async () => {
		const { token } = await createAdmin({ email: "admin-deletepose404@test.com" });

		const res = await request(app)
			.delete(`${BASE}/poses/000000000000000000000000`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(404);
	});
});

// ==================== BREATHING PATTERN MANAGEMENT ====================

describe("Admin — POST /breathing-patterns", () => {
	it("creates a breathing pattern and returns 201", async () => {
		const { token } = await createAdmin({ email: "admin-createbreathing@test.com" });

		const res = await request(app)
			.post(`${BASE}/breathing-patterns`)
			.set("Authorization", `Bearer ${token}`)
			.send(BREATHING_PAYLOAD);

		expect(res.status).toBe(201);
		expect(res.body.data).toHaveProperty("romanizationName", "Ujjayi");
		expect(res.body.data).toHaveProperty("isSystemPattern", true);
	});

	it("returns 400 when required fields are missing", async () => {
		const { token } = await createAdmin({ email: "admin-badbreathing@test.com" });

		const res = await request(app)
			.post(`${BASE}/breathing-patterns`)
			.set("Authorization", `Bearer ${token}`)
			.send({ romanizationName: "Incomplete" });

		expect(res.status).toBe(400);
	});
});

describe("Admin — PUT /breathing-patterns/:id", () => {
	it("updates a breathing pattern's difficulty", async () => {
		const { token } = await createAdmin({ email: "admin-updatebreathing@test.com" });
		const pattern = await BreathingPattern.create({
			...BREATHING_PAYLOAD,
			romanizationName: "UpdateBreathing",
		});

		const res = await request(app)
			.put(`${BASE}/breathing-patterns/${pattern._id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ difficulty: "advanced" });

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("difficulty", "advanced");
	});

	it("returns 404 for a non-existent pattern", async () => {
		const { token } = await createAdmin({ email: "admin-updatebreathing404@test.com" });

		const res = await request(app)
			.put(`${BASE}/breathing-patterns/000000000000000000000000`)
			.set("Authorization", `Bearer ${token}`)
			.send({ difficulty: "advanced" });

		expect(res.status).toBe(404);
	});
});

describe("Admin — DELETE /breathing-patterns/:id", () => {
	it("deletes a breathing pattern and returns 200", async () => {
		const { token } = await createAdmin({ email: "admin-deletebreathing@test.com" });
		const pattern = await BreathingPattern.create({
			...BREATHING_PAYLOAD,
			romanizationName: "DeleteBreathing",
		});

		const res = await request(app)
			.delete(`${BASE}/breathing-patterns/${pattern._id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});

	it("returns 404 for a non-existent pattern", async () => {
		const { token } = await createAdmin({ email: "admin-deletebreathing404@test.com" });

		const res = await request(app)
			.delete(`${BASE}/breathing-patterns/000000000000000000000000`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(404);
	});
});

// ==================== VK SEQUENCE MANAGEMENT ====================

describe("Admin — POST /sequences", () => {
	it("creates a VK sequence and returns 201", async () => {
		const { token } = await createAdmin({ email: "admin-createseq@test.com" });

		const res = await request(app)
			.post(`${BASE}/sequences`)
			.set("Authorization", `Bearer ${token}`)
			.send(VK_SEQUENCE_PAYLOAD);

		expect(res.status).toBe(201);
		expect(res.body.data).toHaveProperty("family", "tadasana");
		expect(res.body.data).toHaveProperty("level", 1);
		expect(res.body.data).toHaveProperty("isSystemSequence", true);
	});

	it("returns 400 when required fields are missing", async () => {
		const { token } = await createAdmin({ email: "admin-badseq@test.com" });

		const res = await request(app)
			.post(`${BASE}/sequences`)
			.set("Authorization", `Bearer ${token}`)
			.send({ family: "tadasana" });

		expect(res.status).toBe(400);
	});
});

describe("Admin — PUT /sequences/:id", () => {
	it("updates a VK sequence's english name", async () => {
		const { token } = await createAdmin({ email: "admin-updateseq@test.com" });
		const seq = await VKSequence.create({ ...VK_SEQUENCE_PAYLOAD, isSystemSequence: true });

		const res = await request(app)
			.put(`${BASE}/sequences/${seq._id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ englishName: "Updated Name" });

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("englishName", "Updated Name");
	});

	it("returns 404 for a non-existent sequence", async () => {
		const { token } = await createAdmin({ email: "admin-updateseq404@test.com" });

		const res = await request(app)
			.put(`${BASE}/sequences/000000000000000000000000`)
			.set("Authorization", `Bearer ${token}`)
			.send({ englishName: "Ghost" });

		expect(res.status).toBe(404);
	});
});

describe("Admin — DELETE /sequences/:id", () => {
	it("deletes a VK sequence and returns 200", async () => {
		const { token } = await createAdmin({ email: "admin-deleteseq@test.com" });
		const seq = await VKSequence.create({ ...VK_SEQUENCE_PAYLOAD, isSystemSequence: true });

		const res = await request(app)
			.delete(`${BASE}/sequences/${seq._id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});

	it("returns 404 for a non-existent sequence", async () => {
		const { token } = await createAdmin({ email: "admin-deleteseq404@test.com" });

		const res = await request(app)
			.delete(`${BASE}/sequences/000000000000000000000000`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(404);
	});
});

// ==================== ANALYTICS ====================

describe("Admin — GET /analytics/dashboard", () => {
	it("returns platform statistics with 200", async () => {
		const { token } = await createAdmin({ email: "admin-dashboard@test.com" });

		const res = await request(app)
			.get(`${BASE}/analytics/dashboard`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("users");
		expect(res.body.data).toHaveProperty("content");
		expect(res.body.data).toHaveProperty("sessions");
		expect(res.body.data.users).toHaveProperty("total");
	});
});

describe("Admin — GET /analytics/users/:userId", () => {
	it("returns analytics for a specific user", async () => {
		const { token } = await createAdmin({ email: "admin-useranalytics@test.com" });
		const { user } = await createUser({ email: "analytics-target@test.com" });

		const res = await request(app)
			.get(`${BASE}/analytics/users/${user._id}`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("user");
		expect(res.body.data).toHaveProperty("sessionsByType");
		expect(res.body.data).toHaveProperty("journalCount");
		expect(res.body.data).toHaveProperty("vkProgression");
	});

	it("returns 404 for a non-existent user", async () => {
		const { token } = await createAdmin({ email: "admin-analytics404@test.com" });

		const res = await request(app)
			.get(`${BASE}/analytics/users/000000000000000000000000`)
			.set("Authorization", `Bearer ${token}`);

		expect(res.status).toBe(404);
	});
});
