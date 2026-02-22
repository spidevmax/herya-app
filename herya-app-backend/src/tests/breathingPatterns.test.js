const request = require("supertest");
const app = require("../app");
const BreathingPattern = require("../api/models/BreathingPattern.model");

const BASE = "/api/v1/breathing-patterns";

const breathingPatternFactory = (overrides = {}) => ({
	romanizationName: "Ujjayi Pranayama",
	iastName: "Ujjāyī Prāṇāyāma",
	sanskritName: "उज्जायी प्राणायाम",
	description: "Ocean breath — a calming pranayama technique",
	difficulty: "beginner",
	energyEffect: "calming",
	...overrides,
});

describe("Breathing Patterns — GET /", () => {
	it("returns 200 with an empty list when no patterns exist", async () => {
		const res = await request(app).get(BASE);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});
});

describe("Breathing Patterns — GET /search", () => {
	it("returns 200 for a valid search query", async () => {
		const res = await request(app).get(`${BASE}/search?q=ujjayi`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});

	it("returns 400 when search query is missing", async () => {
		const res = await request(app).get(`${BASE}/search`);
		expect(res.status).toBe(400);
	});
});

describe("Breathing Patterns — GET /recommended", () => {
	it("returns 404 when database is empty", async () => {
		const res = await request(app).get(`${BASE}/recommended?goal=calm`);
		expect(res.status).toBe(404);
	});

	it("returns 200 with a pattern when data exists", async () => {
		await BreathingPattern.create(breathingPatternFactory());
		const res = await request(app).get(`${BASE}/recommended?goal=calm`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toHaveProperty("pattern");
		expect(res.body.data).toHaveProperty("reason");
	});
});

describe("Breathing Patterns — GET /progression", () => {
	it("returns 200 with progression data", async () => {
		const res = await request(app).get(`${BASE}/progression`);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});
});

describe("Breathing Patterns — GET /:id", () => {
	it("returns 404 for a non-existent id", async () => {
		const res = await request(app).get(`${BASE}/000000000000000000000000`);
		expect(res.status).toBe(404);
	});

	it("returns 400 for an invalid id format", async () => {
		const res = await request(app).get(`${BASE}/not-a-valid-id`);
		expect(res.status).toBe(400);
	});
});
