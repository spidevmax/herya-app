const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

// Set environment variables before any module is loaded
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-herya-app";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-api-key";
process.env.CLOUDINARY_API_SECRET = "test-api-secret";

let mongoServer;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
	// Clear all collections between tests for isolation
	const collections = mongoose.connection.collections;
	for (const key in collections) {
		await collections[key].deleteMany({});
	}
});

afterAll(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
});
