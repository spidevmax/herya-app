const mongoose = require("mongoose");

/**
 * Initializes and connects to MongoDB database
 *
 * Establishes a connection to the MongoDB database using Mongoose ODM.
 * This function should be called early in the application startup (e.g., in app.js)
 * to ensure database access is available before handling requests.
 *
 * Connection Details:
 * - Uses MongoDB connection URL from DB_URL environment variable
 * - Mongoose automatically handles connection pooling and retries
 * - Connection state is persistent throughout the application lifecycle
 *
 * Error Handling:
 * - If connection fails, logs error to console but doesn't throw
 * - Application continues running even without database connection
 * - Database operations will fail at runtime if not properly connected
 * - Consider implementing retry logic for production environments
 *
 * Environment Variables Required:
 * - DB_URL: MongoDB connection string
 *
 * MongoDB Connection States:
 * - 0: Disconnected
 * - 1: Connected (default)
 * - 2: Connecting
 * - 3: Disconnecting
 *
 * @returns {Promise<void>} Connection promise (can be awaited but not required)
 *
 * @example
 * // In app.js
 * const { connectDB } = require("./src/config/db");
 * connectDB(); // Initialize database connection
 *
 * @example
 * // With await (blocking until connection)
 * const { connectDB } = require("./src/config/db");
 * await connectDB();
 * console.log("Database ready, starting server...");
 */
const connectDB = async () => {
	try {
		await mongoose.connect(process.env.DB_URL);
		console.log("MongoDB connected successfully");
	} catch (error) {
		console.log("Error connecting database: ", error.message);
	}
};

module.exports = { connectDB };
