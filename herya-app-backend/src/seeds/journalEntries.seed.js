const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const JournalEntry = require("../api/models/JournalEntry.model");
const Session = require("../api/models/Session.model");

/**
 * Seed Journal Entries from CSV file
 * Each entry uses the first available session (seed demo data only)
 */
async function seedJournalEntries() {
	try {
		const existingJournals = await JournalEntry.countDocuments();
		if (existingJournals > 0) {
			console.log("⏭️  Journal entries already seeded, skipping...");
			return;
		}

		/*
		 * Entries follow their session's owner instead of User.findOne(), so a
		 * reflection can never end up on a different account than the practice
		 * it describes — and never on the admin, which cannot open /journal.
		 */
		const sessions = await Session.find({}, { _id: 1, user: 1 }).sort({ date: 1 }).lean();

		if (sessions.length === 0) {
			console.log("⚠️  No sessions found, skipping journal seeding (session is required)");
			return;
		}

		// Read CSV file
		const csvPath = path.join(__dirname, "data", "journalEntries.csv");
		const csvContent = fs.readFileSync(csvPath, "utf-8");

		// Parse CSV
		const { data, errors } = Papa.parse(csvContent, {
			header: true,
			dynamicTyping: false,
			skipEmptyLines: true,
		});

		if (errors.length > 0) {
			throw new Error(`CSV parsing errors: ${errors.map((e) => e.message).join(", ")}`);
		}

		// Valid mood values from JournalEntry schema (moodBefore and moodAfter have different enums)
		const validMoodsBefore = new Set([
			"calm",
			"anxious",
			"energized",
			"tired",
			"focused",
			"stressed",
			"happy",
			"sad",
			"grounded",
			"restless",
			"peaceful",
			"overwhelmed",
			"motivated",
			"discouraged",
			"scattered",
			"irritated",
		]);

		const validMoodsAfter = new Set([
			"calm",
			"anxious",
			"energized",
			"tired",
			"focused",
			"stressed",
			"happy",
			"sad",
			"grounded",
			"restless",
			"peaceful",
			"overwhelmed",
			"motivated",
			"discouraged",
			"renewed",
			"centered",
			"light",
			"clear",
			"scattered",
			"irritated",
		]);

		const parseMoodsBefore = (str) =>
			str
				? str
						.split("|")
						.map((m) => m.trim())
						.filter((m) => validMoodsBefore.has(m))
				: [];

		const parseMoodsAfter = (str) =>
			str
				? str
						.split("|")
						.map((m) => m.trim())
						.filter((m) => validMoodsAfter.has(m))
				: [];

		// Transform CSV data to JournalEntry schema
		const journalEntries = data.map((row, index) => {
			const daysAgo = data.length - index;
			const moodBefore = parseMoodsBefore(row.moodBefore);
			const moodAfter = parseMoodsAfter(row.moodAfter);

			const session = sessions[index % sessions.length];

			return {
				user: session.user,
				session: session._id,
				moodBefore: moodBefore.length > 0 ? moodBefore : ["calm"],
				moodAfter: moodAfter.length > 0 ? moodAfter : ["peaceful"],
				energyLevel: {
					before: parseInt(row.energyLevel_before, 10) || 5,
					after: parseInt(row.energyLevel_after, 10) || 5,
				},
				stressLevel: {
					before: parseInt(row.stressLevel_before, 10) || 5,
					after: parseInt(row.stressLevel_after, 10) || 5,
				},
				physicalSensations: row.physicalSensations || undefined,
				emotionalNotes: row.emotionalNotes || undefined,
				insights: row.insights || undefined,
				createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
			};
		});

		// Insert into database
		await JournalEntry.insertMany(journalEntries);
		console.log(`✅ Seeded ${journalEntries.length} journal entries from CSV`);
	} catch (error) {
		console.error("❌ Error seeding journal entries:", error.message);
		throw error;
	}
}

module.exports = seedJournalEntries;
