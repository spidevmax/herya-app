const request = require("supertest");
const app = require("../app");
const Pose = require("../api/models/Pose.model");
const { poseFactory } = require("./helpers");

const BASE = "/api/v1/poses";

describe("Poses — GET /", () => {
	beforeEach(async () => {
		await Pose.create([
			poseFactory({ name: "Mountain Pose", romanizationName: "Tadasana" }),
			poseFactory({
				name: "Warrior I",
				romanizationName: "Virabhadrasana I",
				difficulty: "intermediate",
			}),
			poseFactory({ name: "Child Pose", romanizationName: "Balasana" }),
		]);
	});

	it("returns all poses with 200", async () => {
		const res = await request(app).get(BASE);
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data.poses)).toBe(true);
		expect(res.body.data.poses.length).toBe(3);
	});

	it("respects the limit query parameter", async () => {
		const res = await request(app).get(`${BASE}?limit=2`);
		expect(res.status).toBe(200);
		expect(res.body.data.poses.length).toBeLessThanOrEqual(2);
	});
});

describe("Poses — GET /search", () => {
	beforeEach(async () => {
		await Pose.createIndexes(); // Ensure text index exists before $text queries
		await Pose.create(poseFactory({ name: "Tree Pose", romanizationName: "Vrikshasana" }));
	});

	it("finds poses matching a query", async () => {
		const res = await request(app).get(`${BASE}/search?q=tree`);
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.data.length).toBeGreaterThan(0);
	});

	it("returns empty array when no match", async () => {
		const res = await request(app).get(`${BASE}/search?q=zzznomatch`);
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.data.length).toBe(0);
	});
});

describe("Poses — GET /category/:category", () => {
	beforeEach(async () => {
		await Pose.create(poseFactory({ vkCategory: { primary: "standing_mountain" } }));
	});

	it("returns poses filtered by category", async () => {
		const res = await request(app).get(`${BASE}/category/standing_mountain`);
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.data.length).toBeGreaterThan(0);
	});
});

describe("Poses — GET /:id", () => {
	it("returns a pose by valid id", async () => {
		const pose = await Pose.create(poseFactory({ name: "Single Pose" }));
		const res = await request(app).get(`${BASE}/${pose._id}`);
		expect(res.status).toBe(200);
		expect(res.body.data).toHaveProperty("name", "Single Pose");
	});

	it("returns 404 for a non-existent id", async () => {
		const res = await request(app).get(`${BASE}/000000000000000000000000`);
		expect(res.status).toBe(404);
	});
});
