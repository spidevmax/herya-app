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
			throw new Error(`CSV parsing errors: ${errors.map((e) => e.message).join(", ")}`);
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
		const toBool = (val) => val === true || val === "true" || val === 1 || val === "1";

		// Transform CSV data to BreathingPattern schema
		const breathingPatterns = data.map((row) => ({
			// IDENTIFICATION
			romanizationName: row.romanizationName?.trim(),
			iastName: row.iastName?.trim(),
			sanskritName: row.sanskritName?.trim(),
			alias: toArray(row.alias),
			description: row.description?.trim(),
			descriptionEs: row.descriptionEs?.trim() || undefined,

			// CLASSIFICATION
			difficulty: row.difficulty?.trim() || "beginner",

			// BREATHING PATTERN
			patternType: row.patternType?.trim() || "ratio_based",
			patternRatio: {
				inhale: row["patternRatio.inhale"] ?? 1,
				hold: row["patternRatio.hold"] ?? 0,
				exhale: row["patternRatio.exhale"] ?? 1,
				holdAfterExhale: row["patternRatio.holdAfterExhale"] ?? 0,
			},
			baseBreathDuration: row.baseBreathDuration ?? 5,

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
					enabled: toBool(row["vkTechniques.nadishodhana.enabled"]),
					...(row["vkTechniques.nadishodhana.pattern"] && {
						pattern: row["vkTechniques.nadishodhana.pattern"],
					}),
				},
				kapalabhati: {
					enabled: toBool(row["vkTechniques.kapalabhati.enabled"]),
					...(row["vkTechniques.kapalabhati.pumpingRate"] != null && {
						pumpingRate: row["vkTechniques.kapalabhati.pumpingRate"],
					}),
					rounds: row["vkTechniques.kapalabhati.rounds"] ?? 3,
				},
				bhastrika: {
					enabled: toBool(row["vkTechniques.bhastrika.enabled"]),
					intensity: row["vkTechniques.bhastrika.intensity"] || "gentle",
					rounds: row["vkTechniques.bhastrika.rounds"] ?? 3,
				},
				ujjayi: {
					enabled: toBool(row["vkTechniques.ujjayi.enabled"]),
					withSound:
						row["vkTechniques.ujjayi.withSound"] != null
							? toBool(row["vkTechniques.ujjayi.withSound"])
							: true,
				},
				bhramari: {
					enabled: toBool(row["vkTechniques.bhramari.enabled"]),
					pitch: row["vkTechniques.bhramari.pitch"] || "medium",
				},
				cooling: {
					enabled: toBool(row["vkTechniques.cooling.enabled"]),
					type: row["vkTechniques.cooling.type"] || "sitali",
				},
				bandhas: {
					mula: toBool(row["vkTechniques.bandhas.mula"]),
					uddiyana: toBool(row["vkTechniques.bandhas.uddiyana"]),
					jalandhara: toBool(row["vkTechniques.bandhas.jalandhara"]),
					whenToApply: row["vkTechniques.bandhas.whenToApply"] || "none",
				},
				mudra: row["vkTechniques.mudra"] || "none",
			},

			// BENEFITS AND CONTRAINDICATIONS
			benefits: toArray(row.benefits),
			benefitsEs: toArray(row.benefitsEs),
			contraindications: toArray(row.contraindications),
			contraindicationsEs: toArray(row.contraindicationsEs),
			warnings: row.warnings?.trim() || undefined,
			warningsEs: row.warningsEs?.trim() || undefined,

			// VK CONTEXT
			vkContext: {
				practicePhase: row["vkContext.practicePhase"]?.trim() || "opening",
				recommendedBefore: toArray(row["vkContext.recommendedBefore"]),
				progressionNotes: row["vkContext.progressionNotes"]?.trim() || undefined,
			},

			// UI/UX
			visualType: row.visualType?.trim() || "circle",
			soundCue: row.soundCue?.trim() || "bell",

			// EFFECTS
			energyEffect: row.energyEffect?.trim() || "balancing",
			bestTimeOfDay: toArray(row.bestTimeOfDay),

			// METADATA
			tags: toArray(row.tags),
			isSystemPattern: toBool(row.isSystemPattern),
		}));

		// Upsert by romanizationName — updates existing patterns with latest seed data
		const ops = breathingPatterns.map((pattern) => ({
			updateOne: {
				filter: { romanizationName: pattern.romanizationName },
				update: { $set: pattern },
				upsert: true,
			},
		}));
		const result = await BreathingPattern.bulkWrite(ops);
		console.log(
			`✅ Breathing patterns seeded: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`,
		);
	} catch (error) {
		console.error("❌ Error seeding breathing patterns:", error.message);
		throw error;
	}
}

module.exports = seedBreathingPatterns;
