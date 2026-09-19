const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const ChildProfile = require("../api/models/ChildProfile.model");
const User = require("../api/models/User.model");

/**
 * Split a comma-separated CSV cell into a trimmed array.
 * Empty cells become an empty array.
 */
function parseList(value) {
	if (!value) return [];
	return value
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

/**
 * Seed ChildProfiles from CSV file.
 * Resolves the `tutor` reference by looking up the tutor's email,
 * so the CSV never has to carry raw ObjectIds.
 */
async function seedChildProfiles() {
	try {
		const existingProfiles = await ChildProfile.countDocuments();
		if (existingProfiles > 0) {
			console.log("⏭️  Child profiles already seeded, skipping...");
			return;
		}

		// Read CSV file
		const csvPath = path.join(__dirname, "data", "childProfiles.csv");
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

		// Resolve tutor emails to ObjectIds in a single query
		const tutorEmails = [...new Set(data.map((row) => row.tutorEmail).filter(Boolean))];
		const tutors = await User.find({ email: { $in: tutorEmails } }, { _id: 1, email: 1 }).lean();
		const tutorIdByEmail = new Map(tutors.map((tutor) => [tutor.email, tutor._id]));

		let count = 0;
		for (const row of data) {
			const tutorId = tutorIdByEmail.get(row.tutorEmail);
			if (!tutorId) {
				console.log(`⚠️  Skipping '${row.name}' – tutor ${row.tutorEmail} not found`);
				continue;
			}

			const profile = new ChildProfile({
				tutor: tutorId,
				name: row.name,
				age: parseInt(row.age, 10) || undefined,
				avatarColor: row.avatarColor || undefined,
				safetyAnchors: {
					phrase: row.safetyPhrase || "",
					bodyCue: row.bodyCue || "",
				},
				knownTriggers: parseList(row.knownTriggers),
				contraindications: parseList(row.contraindications),
				notes: row.notes || undefined,
				active: row.active !== "false",
			});

			await profile.save();
			count++;
		}

		console.log(`✅ Seeded ${count} child profiles from CSV`);
	} catch (error) {
		console.error("❌ Error seeding child profiles:", error.message);
		throw error;
	}
}

module.exports = seedChildProfiles;
