require("dotenv").config();

const mongoose = require("mongoose");
const { connectDB } = require("./src/config/db");
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

// Connect to database and start server with graceful shutdown handling
(async () => {
	await connectDB();

	const server = app.listen(PORT, () => {
		console.log(`Server running at http://localhost:${PORT}`);
	});

	const shutdown = async (signal) => {
		console.log(`${signal} received. Shutting down gracefully...`);
		server.close(async () => {
			await mongoose.connection.close();
			console.log("DB connection closed. Process exiting.");
			process.exit(0);
		});
	};

	process.on("SIGTERM", () => shutdown("SIGTERM"));
	process.on("SIGINT", () => shutdown("SIGINT"));
})();
