const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const User = require("../api/models/User.model");

/**
 * Seed Users from CSV file
 * Reads users.csv and populates User collection.
 *
 * IMPORTANT: Uses individual User.save() calls (not insertMany) so that
 * the pre-save bcrypt hook runs and passwords are stored hashed.
 */
async function seedUsers() {
	try {
		const existingUsers = await User.countDocuments();
		if (existingUsers > 0) {
			console.log("⏭️  Users already seeded, skipping...");
			return;
		}

		// Read CSV file
		const csvPath = path.join(__dirname, "data", "users.csv");
		const csvContent = fs.readFileSync(csvPath, "utf-8");

		// Parse CSV with Papa Parse
		const { data, errors } = Papa.parse(csvContent, {
			header: true,
			dynamicTyping: false,
			skipEmptyLines: true,
		});

		if (errors.length > 0) {
			throw new Error(`CSV parsing errors: ${errors.map((e) => e.message).join(", ")}`);
		}

		// Valid values matching model enums
		const validIntensity = ["gentle", "moderate", "vigorous"];
		const validLanguage = ["en", "es"];
		const validTimeOfDay = ["morning", "afternoon", "evening", "anytime"];

		let count = 0;
		for (const row of data) {
			const intensity = validIntensity.includes(row.practiceIntensity)
				? row.practiceIntensity
				: "moderate";
			const language = validLanguage.includes(row.language) ? row.language : "en";
			const timeOfDay = validTimeOfDay.includes(row.timeOfDay) ? row.timeOfDay : "anytime";
			const sessionDuration = parseInt(row.sessionDuration, 10) || 30;
			const lastPracticeDate = row.lastPracticeDate ? new Date(row.lastPracticeDate) : undefined;

			const user = new User({
				name: row.name,
				email: row.email,
				password: row.password, // hashed by pre-save hook
				role: row.role || "user",
				goals: row.goals
					? row.goals
							.split(",")
							.map((g) => g.trim())
							.filter(Boolean)
					: [],
				totalSessions: parseInt(row.totalSessions, 10) || 0,
				totalMinutes: parseInt(row.totalMinutes, 10) || 0,
				currentStreak: parseInt(row.currentStreak, 10) || 0,
				lastPracticeDate,
				vkProgression: {
					unlockedFamilies: ["tadasana"],
					currentMainSequence: null,
					completedSequences: [],
				},
				preferences: {
					practiceIntensity: intensity,
					sessionDuration,
					timeOfDay,
					language,
				},
			});

			await user.save(); // triggers bcrypt pre-save hook
			count++;
		}

		console.log(`✅ Seeded ${count} users from CSV`);
	} catch (error) {
		console.error("❌ Error seeding users:", error.message);
		throw error;
	}
}

module.exports = seedUsers;
