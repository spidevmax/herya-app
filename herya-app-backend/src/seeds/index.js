require("dotenv").config();

const mongoose = require("mongoose");
const seedBreathingPatterns = require("./breathingPatterns.seed");
const seedPoses = require("./poses.seed");
const seedSequences = require("./sequences.seed");
const seedUsers = require("./users.seed");
const seedSessions = require("./sessions.seed");
const seedJournalEntries = require("./journalEntries.seed");
const seedChildProfiles = require("./childProfiles.seed");
const seedSessionTemplates = require("./sessionTemplates.seed");

(async () => {
	try {
		await mongoose.connect(process.env.DB_URL);
		console.log("✅ Connected to MongoDB");

		await mongoose.connection.dropDatabase();
		console.log("🗑️  Database cleared");

		// Orden importante: primero entidades base, luego las que dependen
		await seedPoses();
		await seedBreathingPatterns();
		await seedSequences(); // depends on poses
		await seedUsers(); // base users
		await seedSessions(); // depends on users and sequences
		await seedJournalEntries(); // depends on users and sessions
		await seedChildProfiles(); // depends on users (tutors)
		await seedSessionTemplates(); // depends on users, child profiles, sequences and patterns

		console.log("✅ All seeds completed successfully");
		process.exit(0);
	} catch (error) {
		console.error("❌ Seed error:", error);
		process.exit(1);
	} finally {
		await mongoose.disconnect();
	}
})(); // ← Estos paréntesis invocan la función
