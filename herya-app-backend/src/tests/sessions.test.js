const request = require("supertest");
const app = require("../app");
const { createUser } = require("./helpers");

const BASE = "/api/v1/sessions";
const SESSION_PAYLOAD = { sessionType: "meditation", duration: 30 };

describe("Sessions — GET /", () => {
	it("returns 401 without a token", async () => {
		const res = await request(app).get(BASE);
		expect(res.status).toBe(401);
	});

	it("returns an empty list for a new user", async () => {
		const { token } = await createUser({ email: "sessionlist@test.com" });
		const res = await request(app).get(BASE).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data.sessions)).toBe(true);
	});
});

describe("Sessions — POST /", () => {
	it("creates a session and returns 201", async () => {
		const { token } = await createUser({ email: "sessioncreate@test.com" });
		const res = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(SESSION_PAYLOAD);
		expect(res.status).toBe(201);
		expect(res.body.data).toHaveProperty("sessionType", "meditation");
		expect(res.body.data).toHaveProperty("duration", 30);
	});

	it("returns 400 when required fields are missing", async () => {
		const { token } = await createUser({ email: "sessionbad@test.com" });
		const res = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({ sessionType: "meditation" }); // missing duration
		expect(res.status).toBe(400);
	});
});

describe("Sessions — GET /:id", () => {
	it("returns the session by id", async () => {
		const { token } = await createUser({ email: "sessionbyid@test.com" });
		const create = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(SESSION_PAYLOAD);
		const id = create.body.data._id;
		const res = await request(app).get(`${BASE}/${id}`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("_id", id);
	});

	it("returns 404 for a non-existent id", async () => {
		const { token } = await createUser({ email: "sessionnotfound@test.com" });
		const res = await request(app)
			.get(`${BASE}/000000000000000000000000`)
			.set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(404);
	});
});

describe("Sessions — PUT /:id", () => {
	it("updates a session", async () => {
		const { token } = await createUser({ email: "sessionupdate@test.com" });
		const create = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(SESSION_PAYLOAD);
		const id = create.body.data._id;
		const res = await request(app)
			.put(`${BASE}/${id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ duration: 60, completed: true });
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("duration", 60);
	});
});

describe("Sessions — DELETE /:id", () => {
	it("deletes a session and returns 200", async () => {
		const { token } = await createUser({ email: "sessiondelete@test.com" });
		const create = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send(SESSION_PAYLOAD);
		const id = create.body.data._id;
		const res = await request(app).delete(`${BASE}/${id}`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
	});
});

describe("Sessions — GET /stats", () => {
	it("returns session stats for the authenticated user", async () => {
		const { token } = await createUser({ email: "sessionstats@test.com" });
		const res = await request(app).get(`${BASE}/stats`).set("Authorization", `Bearer ${token}`);
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("totalSessions");
	});
});
