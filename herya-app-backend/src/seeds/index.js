require("dotenv").config();

const mongoose = require("mongoose");
const seedBreathingPatterns = require("./breathingPatterns.seed");
const seedPoses = require("./poses.seed");
const seedSequences = require("./sequences.seed");
const seedUsers = require("./users.seed");

(async () => {
	try {
		await mongoose.connect(process.env.DB_URL);
		console.log("✅ Connected to MongoDB");

		await mongoose.connection.dropDatabase();
		console.log("🗑️  Database cleared");

		// Orden importante: primero entidades base, luego las que dependen
		await seedPoses();
		await seedBreathingPatterns();
		await seedSequences(); // depende de poses
		await seedUsers(); // puede crear algunas sesiones de ejemplo

		console.log("✅ All seeds completed successfully");
		process.exit(0);
	} catch (error) {
		console.error("❌ Seed error:", error);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
	}
})(); // ← Estos paréntesis invocan la función
