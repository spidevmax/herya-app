const request = require("supertest");
const app = require("../app");
const { createUser } = require("./helpers");

const BASE = "/api/v1/sessions";

const PLANNED_SESSION = {
	sessionType: "pranayama",
	duration: 25,
	status: "planned",
	plannedBlocks: [
		{
			blockType: "pranayama",
			label: "Ujjayi Breath",
			durationMinutes: 10,
			order: 0,
		},
		{
			blockType: "pranayama",
			label: "Nadi Shodhana",
			durationMinutes: 10,
			order: 1,
		},
		{
			blockType: "meditation",
			label: "Silent Meditation",
			durationMinutes: 5,
			order: 2,
			meditationType: "silent",
		},
	],
};

describe("Guided Practice — full lifecycle", () => {
	let token;

	beforeEach(async () => {
		const data = await createUser({ email: `guided-${Date.now()}@test.com` });
		token = data.token;
	});

	const auth = () => ({ Authorization: `Bearer ${token}` });

	it("creates a planned session with blocks", async () => {
		const res = await request(app).post(BASE).set(auth()).send(PLANNED_SESSION);

		expect(res.status).toBe(201);
		expect(res.body.data.status).toBe("planned");
		expect(res.body.data.plannedBlocks).toHaveLength(3);
		expect(res.body.data.plannedBlocks[0].label).toBe("Ujjayi Breath");
	});

	it("starts a planned session", async () => {
		const create = await request(app)
			.post(BASE)
			.set(auth())
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		const res = await request(app).post(`${BASE}/${id}/start`).set(auth());

		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("active");
		expect(res.body.data.timerData.startedAt).toBeTruthy();
	});

	it("pauses an active session", async () => {
		const create = await request(app)
			.post(BASE)
			.set(auth())
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		await request(app).post(`${BASE}/${id}/start`).set(auth());

		const res = await request(app).post(`${BASE}/${id}/pause`).set(auth());

		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("paused");
		expect(res.body.data.timerData.pausedAt).toBeTruthy();
	});

	it("resumes a paused session via start", async () => {
		const create = await request(app)
			.post(BASE)
			.set(auth())
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		await request(app).post(`${BASE}/${id}/start`).set(auth());
		await request(app).post(`${BASE}/${id}/pause`).set(auth());

		const res = await request(app).post(`${BASE}/${id}/start`).set(auth());

		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("active");
	});

	it("advances to next block", async () => {
		const create = await request(app)
			.post(BASE)
			.set(auth())
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		await request(app).post(`${BASE}/${id}/start`).set(auth());

		const res = await request(app)
			.post(`${BASE}/${id}/advance-block`)
			.set(auth())
			.send({ direction: "next" });

		expect(res.status).toBe(200);
		expect(res.body.data.timerData.currentBlockIndex).toBe(1);
	});

	it("goes back to previous block", async () => {
		const create = await request(app)
			.post(BASE)
			.set(auth())
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		await request(app).post(`${BASE}/${id}/start`).set(auth());
		await request(app)
			.post(`${BASE}/${id}/advance-block`)
			.set(auth())
			.send({ direction: "next" });

		const res = await request(app)
			.post(`${BASE}/${id}/advance-block`)
			.set(auth())
			.send({ direction: "prev" });

		expect(res.status).toBe(200);
		expect(res.body.data.timerData.currentBlockIndex).toBe(0);
	});

	it("completes a session and updates user stats", async () => {
		const create = await request(app)
			.post(BASE)
			.set(auth())
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		await request(app).post(`${BASE}/${id}/start`).set(auth());

		const res = await request(app)
			.post(`${BASE}/${id}/complete`)
			.set(auth())
			.send({ blocksCompleted: 3 });

		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("completed");
		expect(res.body.data.completed).toBe(true);
		expect(res.body.data.completionRate).toBe(100);
		expect(res.body.data.actualDuration).toBeGreaterThanOrEqual(1);

		// Verify user stats updated
		const stats = await request(app).get(`${BASE}/stats`).set(auth());
		expect(stats.body.data.totalSessions).toBe(1);
	});

	it("stores tutor support telemetry when completing a session", async () => {
		const create = await request(app)
			.post(BASE)
			.set(auth())
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		await request(app).post(`${BASE}/${id}/start`).set(auth());

		const res = await request(app)
			.post(`${BASE}/${id}/complete`)
			.set(auth())
			.send({
				blocksCompleted: 3,
				tutorSupport: {
					safePauseCount: 2,
					anchorAvailable: true,
					anchorUsed: true,
				},
			});

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("tutorSupport");
		expect(res.body.data.tutorSupport).toEqual({
			safePauseCount: 2,
			anchorAvailable: true,
			anchorUsed: true,
		});
	});

	it("abandons a session with partial completion rate", async () => {
		const create = await request(app)
			.post(BASE)
			.set(auth())
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		await request(app).post(`${BASE}/${id}/start`).set(auth());
		await request(app)
			.post(`${BASE}/${id}/advance-block`)
			.set(auth())
			.send({ direction: "next" });

		const res = await request(app).post(`${BASE}/${id}/abandon`).set(auth());

		expect(res.status).toBe(200);
		expect(res.body.data.status).toBe("abandoned");
		expect(res.body.data.completed).toBe(false);
		expect(res.body.data.completionRate).toBe(33); // 1/3
	});

	it("returns active session for recovery", async () => {
		const create = await request(app)
			.post(BASE)
			.set(auth())
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		await request(app).post(`${BASE}/${id}/start`).set(auth());

		const res = await request(app).get(`${BASE}/active/current`).set(auth());

		expect(res.status).toBe(200);
		expect(res.body.data._id).toBe(id);
		expect(res.body.data.status).toBe("active");
	});

	it("returns null when no active session", async () => {
		const res = await request(app).get(`${BASE}/active/current`).set(auth());

		expect(res.status).toBe(200);
		expect(res.body.data).toBeFalsy();
	});
});

describe("Guided Practice — check-in", () => {
	it("stores check-in data when provided", async () => {
		const { token } = await createUser({
			email: `checkin-${Date.now()}@test.com`,
		});

		const res = await request(app)
			.post(BASE)
			.set({ Authorization: `Bearer ${token}` })
			.send({
				...PLANNED_SESSION,
				checkIn: {
					enabled: true,
					mood: ["calm", "focused"],
					energyLevel: 7,
					intention: "Stay present",
				},
			});

		expect(res.status).toBe(201);
		expect(res.body.data.checkIn.enabled).toBe(true);
		expect(res.body.data.checkIn.mood).toEqual(["calm", "focused"]);
		expect(res.body.data.checkIn.energyLevel).toBe(7);
	});
});

describe("Guided Practice — analytics", () => {
	it("returns analytics for user with sessions", async () => {
		const { token } = await createUser({
			email: `analytics-${Date.now()}@test.com`,
		});
		const auth = { Authorization: `Bearer ${token}` };

		// Create and complete a session
		const create = await request(app)
			.post(BASE)
			.set(auth)
			.send(PLANNED_SESSION);
		const id = create.body.data._id;
		await request(app).post(`${BASE}/${id}/start`).set(auth);
		await request(app)
			.post(`${BASE}/${id}/complete`)
			.set(auth)
			.send({ blocksCompleted: 3 });

		const res = await request(app).get(`${BASE}/analytics/practice`).set(auth);

		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("completionRate");
		expect(res.body.data).toHaveProperty("totalSessions");
		expect(res.body.data).toHaveProperty("byType");
		expect(res.body.data).toHaveProperty("mostUsedBlocks");
	});
});

describe("Guided Practice — error cases", () => {
	let token;

	beforeEach(async () => {
		const data = await createUser({ email: `err-${Date.now()}@test.com` });
		token = data.token;
	});

	it("cannot start an already completed session", async () => {
		const create = await request(app)
			.post(BASE)
			.set({ Authorization: `Bearer ${token}` })
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		await request(app)
			.post(`${BASE}/${id}/start`)
			.set({ Authorization: `Bearer ${token}` });
		await request(app)
			.post(`${BASE}/${id}/complete`)
			.set({ Authorization: `Bearer ${token}` })
			.send({ blocksCompleted: 3 });

		const res = await request(app)
			.post(`${BASE}/${id}/start`)
			.set({ Authorization: `Bearer ${token}` });

		expect(res.status).toBe(400);
	});

	it("cannot pause an already paused session", async () => {
		const create = await request(app)
			.post(BASE)
			.set({ Authorization: `Bearer ${token}` })
			.send(PLANNED_SESSION);
		const id = create.body.data._id;

		await request(app)
			.post(`${BASE}/${id}/start`)
			.set({ Authorization: `Bearer ${token}` });
		await request(app)
			.post(`${BASE}/${id}/pause`)
			.set({ Authorization: `Bearer ${token}` });

		const res = await request(app)
			.post(`${BASE}/${id}/pause`)
			.set({ Authorization: `Bearer ${token}` });

		expect(res.status).toBe(400);
	});
});
