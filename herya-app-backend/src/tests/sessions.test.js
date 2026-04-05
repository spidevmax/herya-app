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

	it("persists tutor check-in signal when provided", async () => {
		const { token } = await createUser({
			email: "sessioncheckinsignal@test.com",
		});
		const res = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({
				...SESSION_PAYLOAD,
				checkIn: {
					enabled: true,
					mood: ["focused"],
					energyLevel: 5,
					signal: "yellow",
					intention: "tutor-guided",
				},
			});

		expect(res.status).toBe(201);
		expect(res.body.data).toHaveProperty("checkIn.signal", "yellow");
	});

	it("updates user counters when creating an already completed session", async () => {
		const { token } = await createUser({
			email: "sessioncreatecompleted@test.com",
		});

		const createRes = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({ ...SESSION_PAYLOAD, completed: true, duration: 45 });

		expect(createRes.status).toBe(201);

		const statsRes = await request(app)
			.get(`${BASE}/stats`)
			.set("Authorization", `Bearer ${token}`);

		expect(statsRes.status).toBe(200);
		expect(statsRes.body.data).toHaveProperty("totalSessions", 1);
		expect(statsRes.body.data).toHaveProperty("totalMinutes", 45);
		expect(statsRes.body.data).toHaveProperty("currentStreak", 1);
	});

	it("keeps existing streak when a completed backdated session is added", async () => {
		const { token } = await createUser({
			email: "sessionbackdatedstreak@test.com",
		});

		await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({
				...SESSION_PAYLOAD,
				completed: true,
				date: "2026-03-30T10:00:00.000Z",
			});

		await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({
				...SESSION_PAYLOAD,
				completed: true,
				date: "2026-03-31T10:00:00.000Z",
			});

		await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({
				...SESSION_PAYLOAD,
				completed: true,
				date: "2026-04-01T10:00:00.000Z",
			});

		const beforeBackdated = await request(app)
			.get(`${BASE}/stats`)
			.set("Authorization", `Bearer ${token}`);

		expect(beforeBackdated.status).toBe(200);
		expect(beforeBackdated.body.data).toHaveProperty("currentStreak", 3);

		await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({
				...SESSION_PAYLOAD,
				completed: true,
				date: "2026-03-29T10:00:00.000Z",
			});

		const afterBackdated = await request(app)
			.get(`${BASE}/stats`)
			.set("Authorization", `Bearer ${token}`);

		expect(afterBackdated.status).toBe(200);
		expect(afterBackdated.body.data).toHaveProperty("currentStreak", 3);
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

	it("updates user counters when session transitions to completed", async () => {
		const { token } = await createUser({ email: "sessiontransition@test.com" });

		const create = await request(app)
			.post(BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({ ...SESSION_PAYLOAD, completed: false, duration: 30 });

		expect(create.status).toBe(201);

		const id = create.body.data._id;
		const update = await request(app)
			.put(`${BASE}/${id}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ completed: true, duration: 50 });

		expect(update.status).toBe(200);

		const statsRes = await request(app)
			.get(`${BASE}/stats`)
			.set("Authorization", `Bearer ${token}`);

		expect(statsRes.status).toBe(200);
		expect(statsRes.body.data).toHaveProperty("totalSessions", 1);
		expect(statsRes.body.data).toHaveProperty("totalMinutes", 50);
		expect(statsRes.body.data).toHaveProperty("currentStreak", 1);
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
		expect(res.body.data).toHaveProperty("tutorInsights");
		expect(res.body.data.tutorInsights).toHaveProperty("sessionCount");
		expect(res.body.data.tutorInsights).toHaveProperty("totalSafePauses");
		expect(res.body.data.tutorInsights).toHaveProperty("anchorUseRate");
		expect(res.body.data.tutorInsights).toHaveProperty("weeklyTrend");
		expect(res.body.data.tutorInsights.weeklyTrend).toHaveProperty("currentWeek");
		expect(res.body.data.tutorInsights.weeklyTrend).toHaveProperty("previousWeek");
		expect(res.body.data.tutorInsights.weeklyTrend).toHaveProperty("delta");
		expect(res.body.data.tutorInsights).toHaveProperty("recommendation");
		expect(res.body.data.tutorInsights.recommendation).toHaveProperty("key");
		expect(res.body.data.tutorInsights.recommendation).toHaveProperty("severity");
		expect(res.body.data.tutorInsights.recommendation).toHaveProperty("preset");
		expect(res.body.data.tutorInsights.recommendation).toHaveProperty("confidence");
		expect(res.body.data.tutorInsights).toHaveProperty("recommendationOutcome");
		expect(res.body.data.tutorInsights.recommendationOutcome).toHaveProperty("appliedCount");
		expect(res.body.data.tutorInsights.recommendationOutcome).toHaveProperty("improvedRate");
	});
});
