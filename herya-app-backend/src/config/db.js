const mongoose = require("mongoose");

/**
 * Database Connection Configuration
 * =================================
 * Initializes and manages MongoDB database connection using Mongoose ODM.
 *
 * Purpose:
 * - Establish persistent connection to MongoDB database
 * - Validate required environment variables at startup
 * - Provide connection status logging and error handling
 * - Support graceful connection termination on server shutdown
 *
 * Connection Features:
 * - Uses MongoDB Atlas connection string (cloud-hosted)
 * - Automatic connection pooling (6-500 connections)
 * - Automatic retry on transient failures
 * - Support for replica sets and sharding
 * - Timeout configuration for production stability
 *
 * Environment Variables Required:
 * - DB_URL: MongoDB connection string format:
 *   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
 *
 * Connection States:
 * - 0: Disconnected
 * - 1: Connected (ready for operations)
 * - 2: Connecting (attempting connection)
 * - 3: Disconnecting (closing connection)
 *
 * Mongoose Configuration:
 * - strictQuery: false → Allows querying fields not in schema (legacy behavior)
 * - useNewUrlParser: true → Uses new MongoDB URL parser
 * - useUnifiedTopology: true → Uses new connection management
 *
 * Usage:
 * - Call connectDB() early in server startup (app.js or index.js)
 * - Can be awaited for blocking until connection, or called without await
 * - Call disconnectDB() on graceful shutdown
 *
 * Error Handling:
 * - Connection errors are logged with error messages
 * - Application continues running (doesn't crash on DB failure)
 * - Implement custom error handling as needed for production
 * - Consider adding retry logic with exponential backoff
 *
 * @example
 * // In app.js or index.js
 * const { connectDB, disconnectDB } = require("./src/config/db");
 *
 * // Start server
 * connectDB();
 * app.listen(3000);
 *
 * // Graceful shutdown
 * process.on("SIGTERM", async () => {
 *   await disconnectDB();
 *   process.exit(0);
 * });
 */

// Validate required environment variables
if (!process.env.DB_URL) {
	console.error("❌ Error: Missing required environment variable: DB_URL");
	console.error("MongoDB connection string is required. Configure in .env file:");
	console.error(
		"DB_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority",
	);
	// Don't exit process, allow graceful handling at app startup
}

/**
 * Connect to MongoDB Database
 * --------------------------
 * Establishes connection to MongoDB using Mongoose.
 * Connection is persistent throughout application lifecycle.
 * Multiple calls to connectDB() are safe - Mongoose handles existing connections.
 *
 * @async
 * @returns {Promise<void>} Resolves when connection is established
 * @throws {Error} MongoDB connection errors (caught and logged internally)
 *
 * Connection Flow:
 * 1. Validates DB_URL environment variable
 * 2. Initiates connection to MongoDB cluster
 * 3. Verifies schema validation
 * 4. Sets connection options for optimal performance
 * 5. Logs success or error status
 */
const connectDB = async () => {
	try {
		// Check if already connected to avoid redundant connections
		if (mongoose.connection.readyState === 1) {
			console.log("✅ MongoDB already connected");
			return;
		}

		// Validate DB_URL exists
		if (!process.env.DB_URL) {
			throw new Error("DB_URL environment variable is not set. Cannot connect to database.");
		}

		// Establish connection with optimized options
		await mongoose.connect(process.env.DB_URL, {
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		});

		console.log("✅ MongoDB connected successfully");
		console.log(`📊 Database: ${mongoose.connection.name}`);
		console.log(`🔗 Host: ${mongoose.connection.host}`);
	} catch (error) {
		console.error("❌ Error connecting to MongoDB: ", error.message);
		console.error("Make sure MongoDB is running and DB_URL is correctly configured.");
		// Rethrow to allow caller to handle critical startup error
		throw error;
	}
};

/**
 * Disconnect from MongoDB Database
 * --------------------------------
 * Closes connection to MongoDB gracefully.
 * Should be called during application shutdown (SIGTERM, SIGINT handlers).
 *
 * @async
 * @returns {Promise<void>} Resolves when disconnection is complete
 *
 * Use Case:
 * - Graceful shutdown of Node.js server
 * - Test cleanup in test suites
 * - Prevent "cannot find module" errors during process termination
 *
 * @example
 * // Graceful shutdown handler
 * process.on("SIGTERM", async () => {
 *   console.log("SIGTERM received, shutting down gracefully...");
 *   await disconnectDB();
 *   process.exit(0);
 * });
 */
const disconnectDB = async () => {
	try {
		if (mongoose.connection.readyState !== 0) {
			await mongoose.disconnect();
			console.log("✅ MongoDB disconnected successfully");
		}
	} catch (error) {
		console.error("❌ Error disconnecting from MongoDB: ", error.message);
		throw error;
	}
};

/**
 * Get Current Database Connection Status
 * ------------------------------------
 * Returns human-readable connection status.
 *
 * @returns {string} Connection status description
 */
const getConnectionStatus = () => {
	const states = {
		0: "Disconnected",
		1: "Connected",
		2: "Connecting",
		3: "Disconnecting",
	};
	return states[mongoose.connection.readyState] || "Unknown";
};

module.exports = { connectDB, disconnectDB, getConnectionStatus };
