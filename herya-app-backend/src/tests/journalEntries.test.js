const request = require("supertest");
const app = require("../app");
const { createUser, createSession } = require("./helpers");

const BASE = "/api/v1/journal-entries";

const JOURNAL_PAYLOAD = (sessionId) => ({
	session: sessionId,
	moodBefore: ["stressed", "anxious"],
	moodAfter: ["calm", "peaceful"],
	signalAfter: "yellow",
	energyLevel: { before: 4, after: 8 },
	stressLevel: { before: 7, after: 3 },
});

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
			.send(JOURNAL_PAYLOAD(session._id));
		expect(res.status).toBe(201);
		expect(res.body.data).toHaveProperty("session");
		expect(res.body.data.energyLevel.before).toBe(4);
		expect(res.body.data.energyLevel.after).toBe(8);
		expect(res.body.data).toHaveProperty("signalAfter", "yellow");
	});

	it("returns 400 when required fields are missing", async () => {
		const { token } = await createUser({ email: "journal-bad@test.com" });
		const res = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({ moodBefore: ["calm"] }); // missing most required fields
		expect(res.status).toBe(400);
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

describe("Journal Entries — GET /digital-garden", () => {
	it("returns the digital garden for the authenticated user", async () => {
		const { token } = await createUser({ email: "journal-garden@test.com" });
		const res = await request(app)
			.get(`${BASE}/digital-garden`)
			.set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});
});
