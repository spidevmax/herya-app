const request = require("supertest");
const app = require("../app");

const BASE = "/api/v1/auth";

describe("Auth — POST /register", () => {
	it("registers a new user and returns 201 with token", async () => {
		const res = await request(app).post(`${BASE}/register`).send({
			name: "Marina Test",
			email: "marina@test.com",
			password: "SecurePass123",
		});
		expect(res.status).toBe(201);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toHaveProperty("token");
		expect(res.body.data.user).toHaveProperty("email", "marina@test.com");
	});

	it("returns 400 when registering with an existing email", async () => {
		const payload = { name: "Dup User", email: "dup@test.com", password: "SecurePass123" };
		await request(app).post(`${BASE}/register`).send(payload);
		const res = await request(app).post(`${BASE}/register`).send(payload);
		expect(res.status).toBe(400);
		expect(res.body).toHaveProperty("error");
	});

	it("returns 400 when required fields are missing", async () => {
		const res = await request(app).post(`${BASE}/register`).send({ email: "missing@test.com" });
		expect(res.status).toBe(400);
	});
});

describe("Auth — POST /login", () => {
	beforeEach(async () => {
		await request(app).post(`${BASE}/register`).send({
			name: "Login User",
			email: "login@test.com",
			password: "SecurePass123",
		});
	});

	it("logs in with correct credentials and returns 200 with token", async () => {
		const res = await request(app).post(`${BASE}/login`).send({
			email: "login@test.com",
			password: "SecurePass123",
		});
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toHaveProperty("token");
	});

	it("returns 404 when email does not exist", async () => {
		const res = await request(app).post(`${BASE}/login`).send({
			email: "ghost@test.com",
			password: "SecurePass123",
		});
		expect(res.status).toBe(404);
	});

	it("returns 401 when password is incorrect", async () => {
		const res = await request(app).post(`${BASE}/login`).send({
			email: "login@test.com",
			password: "WrongPass999",
		});
		expect(res.status).toBe(401);
	});
});
