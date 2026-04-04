require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../api/models/User.model");

(async () => {
	try {
		if (!process.env.DB_URL) {
			throw new Error("Missing DB_URL environment variable");
		}

		await mongoose.connect(process.env.DB_URL);
		console.log("✅ Connected to MongoDB");

		const eligibleCount = await User.countDocuments({
			role: "user",
			"preferences.lowStimMode": true,
		});

		if (eligibleCount === 0) {
			console.log("ℹ️  No users to migrate. Nothing changed.");
			process.exit(0);
		}

		const result = await User.updateMany(
			{
				role: "user",
				"preferences.lowStimMode": true,
			},
			{ $set: { role: "tutor" } },
		);

		console.log(
			`✅ Tutor role migration completed. Matched: ${result.matchedCount}, Updated: ${result.modifiedCount}`,
		);
		process.exit(0);
	} catch (error) {
		console.error("❌ Tutor role migration failed:", error.message);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
	}
})();
