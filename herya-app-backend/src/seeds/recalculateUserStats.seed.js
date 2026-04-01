require("dotenv").config();

const mongoose = require("mongoose");
const seedSessions = require("./sessions.seed");

(async () => {
	try {
		if (!process.env.DB_URL) {
			throw new Error("Missing DB_URL environment variable");
		}

		await mongoose.connect(process.env.DB_URL);
		console.log("✅ Connected to MongoDB");

		await seedSessions.rebuildUserPracticeStats();
		console.log("✅ User practice stats recalculated successfully");
		process.exit(0);
	} catch (error) {
		console.error("❌ Error recalculating user practice stats:", error.message);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
	}
})();
