const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const BreathingPattern = require("../api/models/BreathingPattern.model");

/**
 * Seed Breathing Patterns from CSV file
 * Reads breathingPatterns.csv and populates BreathingPattern collection
 */
async function seedBreathingPatterns() {
	try {
		// Check if patterns already exist
		const existingPatterns = await BreathingPattern.countDocuments();
		if (existingPatterns > 0) {
			console.log("⏭️  Breathing patterns already seeded, skipping...");
			return;
		}

		// Read CSV file
		const csvPath = path.join(__dirname, "data", "breathingPatterns.csv");
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
		// (dynamicTyping handles numbers and booleans; arrays use | as delimiter)
		const toArray = (val) =>
			val != null && val !== ""
				? String(val)
						.split("|")
						.map((s) => s.trim())
						.filter(Boolean)
				: [];

		// Helper: coerce CSV boolean values (dynamicTyping may yield true/false or "true"/"false")
		const toBool = (val) =>
			val === true || val === "true" || val === 1 || val === "1";

		// Transform CSV data to BreathingPattern schema
		const breathingPatterns = data.map((row) => ({
			// IDENTIFICATION
			romanizationName: row["romanizationName"]?.trim(),
			iastName: row["iastName"]?.trim(),
			sanskritName: row["sanskritName"]?.trim(),
			alias: toArray(row["alias"]),
			description: row["description"]?.trim(),

			// CLASSIFICATION
			difficulty: row["difficulty"]?.trim() || "beginner",

			// BREATHING PATTERN
			patternType: row["patternType"]?.trim() || "ratio_based",
			patternRatio: {
				inhale: row["patternRatio.inhale"] ?? 1,
				hold: row["patternRatio.hold"] ?? 0,
				exhale: row["patternRatio.exhale"] ?? 1,
				holdAfterExhale: row["patternRatio.holdAfterExhale"] ?? 0,
			},
			baseBreathDuration: row["baseBreathDuration"] ?? 5,

			// RECOMMENDED PRACTICE
			recommendedPractice: {
				measureBy: row["recommendedPractice.measureBy"] || "cycles",
				durationMinutes: {
					min: row["recommendedPractice.durationMinutes.min"] ?? 3,
					max: row["recommendedPractice.durationMinutes.max"] ?? 10,
					default: row["recommendedPractice.durationMinutes.default"] ?? 5,
				},
				cycles: {
					min: row["recommendedPractice.cycles.min"] ?? 5,
					max: row["recommendedPractice.cycles.max"] ?? 20,
					default: row["recommendedPractice.cycles.default"] ?? 10,
				},
			},

			// VK TECHNIQUES
			vkTechniques: {
				nadishodhana: {
					enabled: row["vkTechniques.nadishodhana.enabled"] ?? false,
				},
				kapalabhati: {
					enabled: row["vkTechniques.kapalabhati.enabled"] ?? false,
				},
				bhastrika: { enabled: row["vkTechniques.bhastrika.enabled"] ?? false },
				ujjayi: { enabled: row["vkTechniques.ujjayi.enabled"] ?? false },
				bhramari: { enabled: row["vkTechniques.bhramari.enabled"] ?? false },
				cooling: { enabled: row["vkTechniques.cooling.enabled"] ?? false },
				bandhas: {
					mula: row["vkTechniques.bandhas.mula"] ?? false,
					uddiyana: row["vkTechniques.bandhas.uddiyana"] ?? false,
					jalandhara: row["vkTechniques.bandhas.jalandhara"] ?? false,
					whenToApply: row["vkTechniques.bandhas.whenToApply"] || "none",
				},
				mudra: row["vkTechniques.mudra"] || "none",
			},

			// BENEFITS AND CONTRAINDICATIONS
			benefits: toArray(row["benefits"]),
			contraindications: toArray(row["contraindications"]),
			warnings: row["warnings"]?.trim() || undefined,

			// VK CONTEXT
			vkContext: {
				practicePhase: row["vkContext.practicePhase"]?.trim() || "opening",
				recommendedBefore: toArray(row["vkContext.recommendedBefore"]),
				progressionNotes:
					row["vkContext.progressionNotes"]?.trim() || undefined,
			},

			// UI/UX
			visualType: row["visualType"]?.trim() || "circle",
			soundCue: row["soundCue"]?.trim() || "bell",

			// EFFECTS
			energyEffect: row["energyEffect"]?.trim() || "balancing",
			bestTimeOfDay: toArray(row["bestTimeOfDay"]),

			// METADATA
			tags: toArray(row["tags"]),
			isSystemPattern: toBool(row["isSystemPattern"]),
		}));

		// Insert into database
		await BreathingPattern.insertMany(breathingPatterns);
		console.log(
			`✅ Seeded ${breathingPatterns.length} breathing patterns from CSV`,
		);
	} catch (error) {
		console.error("❌ Error seeding breathing patterns:", error.message);
		throw error;
	}
}

module.exports = seedBreathingPatterns;
