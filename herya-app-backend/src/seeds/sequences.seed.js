const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const VKSequence = require("../api/models/VinyasaKramaSequence.model");

/**
 * Seed VK Sequences from CSV file
 * Reads sequences.csv and populates VKSequence collection
 */
async function seedSequences() {
	try {
		// Check if sequences already exist
		const existingSequences = await VKSequence.countDocuments();
		if (existingSequences > 0) {
			console.log("⏭️  Sequences already seeded, skipping...");
			return;
		}

		// Read CSV file
		const csvPath = path.join(__dirname, "data", "sequences.csv");
		const csvContent = fs.readFileSync(csvPath, "utf-8");

		// Parse CSV — dynamicTyping auto-converts numbers and booleans
		const { data, errors } = Papa.parse(csvContent, {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true,
		});

		if (errors.length > 0) {
			throw new Error(
				`CSV parsing errors: ${errors.map((e) => e.message).join(", ")}`,
			);
		}

		// Helper: split pipe-separated string into array
		const toArray = (val) =>
			val != null && val !== ""
				? String(val)
						.split("|")
						.map((s) => s.trim())
						.filter(Boolean)
				: [];

		const sequences = data.map((row) => ({
			// VK IDENTIFICATION
			family: row.family?.trim(),
			level: row.level, // dynamicTyping parses as number
			difficulty: row.difficulty?.trim() || "beginner",
			sanskritName: row.sanskritName?.trim(),
			englishName: row.englishName?.trim(),
			description: row.description?.trim() || undefined,

			// PRACTICE
			estimatedDuration: {
				min: row["estimatedDuration.min"] ?? undefined,
				max: row["estimatedDuration.max"] ?? undefined,
				recommended: row["estimatedDuration.recommended"] ?? undefined,
			},

			// THERAPEUTIC ASPECTS
			therapeuticFocus: {
				primaryBenefit: row["therapeuticFocus.primaryBenefit"]?.trim(),
			},

			// METADATA
			tags: toArray(row.tags),
			isSystemSequence:
				row.isSystemSequence !== false && row.isSystemSequence !== "false",
		}));

		await VKSequence.insertMany(sequences);
		console.log(`✅ Seeded ${sequences.length} VK sequences from CSV`);
	} catch (error) {
		console.error("❌ Error seeding sequences:", error.message);
		throw error;
	}
}

module.exports = seedSequences;
