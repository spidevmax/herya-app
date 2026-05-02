const request = require("supertest");
const app = require("../app");
const { createUser, createSession } = require("./helpers");

const BASE = "/api/v1/journal-entries";

// Accepts options to simulate different roles
const JOURNAL_PAYLOAD = (sessionId, opts = {}) => {
	const base = {
		session: sessionId,
		moodBefore: ["stressed", "anxious"],
		moodAfter: ["calm", "peaceful"],
		energyLevel: { before: 4, after: 8 },
		stressLevel: { before: 7, after: 3 },
	};
	// Only include signalAfter for tutor role
	if (opts.role === "tutor") {
		base.signalAfter = "yellow";
	}
	return base;
};

describe("Journal Entries — GET /", () => {
	it("returns 401 without a token", async () => {
		const res = await request(app).get(BASE);
		expect(res.status).toBe(401);
	});

	it("returns an empty list for a new user", async () => {
		const { token } = await createUser({ email: "journal-list@test.com" });
		const res = await request(app).get(BASE).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data.journals)).toBe(true);
	});
});

describe("Journal Entries — POST /", () => {
	it("creates a journal entry and returns 201", async () => {
		const { token } = await createUser({ email: "journal-create@test.com" });
		const session = await createSession(token);
		const res = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(JOURNAL_PAYLOAD(session._id)); // user role: no signalAfter
		expect(res.status).toBe(201);
		expect(res.body.data).toHaveProperty("session");
		expect(res.body.data.energyLevel.before).toBe(4);
		expect(res.body.data.energyLevel.after).toBe(8);
		// For user role, signalAfter should not be present
		expect(res.body.data).not.toHaveProperty("signalAfter");
	});

	it("returns 400 when required fields are missing", async () => {
		const { token } = await createUser({ email: "journal-bad@test.com" });
		const res = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({ moodBefore: ["calm"] }); // missing most required fields
		expect(res.status).toBe(400);
	});

	it("stores physicalSensations as an array of tags", async () => {
		const { token } = await createUser({ email: "journal-sensations@test.com" });
		const session = await createSession(token);
		const res = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({
				...JOURNAL_PAYLOAD(session._id),
				physicalSensations: ["tight_shoulders", "calm"],
			});
		expect(res.status).toBe(201);
		expect(Array.isArray(res.body.data.physicalSensations)).toBe(true);
		expect(res.body.data.physicalSensations).toEqual(["tight_shoulders", "calm"]);
	});
});

describe("Journal Entries — GET /:id", () => {
	it("returns a journal entry by id", async () => {
		const { token } = await createUser({ email: "journal-byid@test.com" });
		const session = await createSession(token);
		const create = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(JOURNAL_PAYLOAD(session._id));
		const id = create.body.data._id;
		const res = await request(app).get(`${BASE}/${id}`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("_id", id);
	});

	it("returns 404 for a non-existent id", async () => {
		const { token } = await createUser({ email: "journal-notfound@test.com" });
		const res = await request(app)
			.get(`${BASE}/000000000000000000000000`)
			.set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(404);
	});
});

describe("Journal Entries — PUT /:id", () => {
	it("updates a journal entry", async () => {
		const { token } = await createUser({ email: "journal-update@test.com" });
		const session = await createSession(token);
		const create = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(JOURNAL_PAYLOAD(session._id));
		const id = create.body.data._id;
		const res = await request(app)
			.put(`${BASE}/${id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ energyLevel: { before: 4, after: 9 } });
		expect(res.status).toBe(200);
		expect(res.body.data.energyLevel.after).toBe(9);
	});
});

describe("Journal Entries — phase: before + PATCH /:id/complete", () => {
	const BEFORE_PAYLOAD = (sessionId) => ({
		session: sessionId,
		phase: "before",
		moodBefore: ["focused"],
		energyLevel: { before: 5 },
		stressLevel: { before: 6 },
	});

	it("creates a 'before' stub without after fields", async () => {
		const { token } = await createUser({ email: "journal-stub@test.com" });
		const session = await createSession(token);
		const res = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(BEFORE_PAYLOAD(session._id));
		expect(res.status).toBe(201);
		expect(res.body.data.phase).toBe("before");
		expect(res.body.data.energyLevel.after).toBeUndefined();
		expect(res.body.data.stressLevel.after).toBeUndefined();
	});

	it("completes a stub via PATCH /:id/complete and merges before/after", async () => {
		const { token } = await createUser({ email: "journal-complete@test.com" });
		const session = await createSession(token);
		const create = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(BEFORE_PAYLOAD(session._id));
		const id = create.body.data._id;

		const res = await request(app)
			.patch(`${BASE}/${id}/complete`)
			.set("Authorization", `Bearer ${token}`)
			.send({
				moodAfter: ["calm"],
				energyLevel: { after: 8 },
				stressLevel: { after: 3 },
			});
		expect(res.status).toBe(200);
		expect(res.body.data.phase).toBe("completed");
		expect(res.body.data.energyLevel.before).toBe(5);
		expect(res.body.data.energyLevel.after).toBe(8);
		expect(res.body.data.stressLevel.before).toBe(6);
		expect(res.body.data.stressLevel.after).toBe(3);
	});

	it("rejects re-completing an already completed entry", async () => {
		const { token } = await createUser({ email: "journal-recomplete@test.com" });
		const session = await createSession(token);
		const create = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(JOURNAL_PAYLOAD(session._id));
		const id = create.body.data._id;
		const res = await request(app)
			.patch(`${BASE}/${id}/complete`)
			.set("Authorization", `Bearer ${token}`)
			.send({ moodAfter: ["calm"] });
		expect(res.status).toBe(400);
	});
});

describe("Journal Entries — DELETE /:id", () => {
	it("deletes a journal entry and returns 200", async () => {
		const { token } = await createUser({ email: "journal-delete@test.com" });
		const session = await createSession(token);
		const create = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(JOURNAL_PAYLOAD(session._id));
		const id = create.body.data._id;
		const res = await request(app).delete(`${BASE}/${id}`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
	});
});
