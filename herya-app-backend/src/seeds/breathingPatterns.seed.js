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

		// Parse CSV
		const { data, errors } = Papa.parse(csvContent, {
			header: true,
			dynamicTyping: false,
			skipEmptyLines: true,
		});

		if (errors.length > 0) {
			throw new Error(`CSV parsing errors: ${errors.map((e) => e.message).join(", ")}`);
		}

		// Map energy effect values from CSV to model enum
		const energyEffectMap = {
			warming: "heating",
			heating: "heating",
			energizing: "energizing",
			balancing: "balancing",
			calming: "calming",
			cooling: "cooling",
		};

		// Build vkTechniques object based on technique name
		const buildVkTechniques = (technique) => {
			const techniques = {
				nadishodhana: { enabled: false },
				kapalabhati: { enabled: false },
				bhastrika: { enabled: false },
				ujjayi: { enabled: false },
				bhramari: { enabled: false },
				cooling: { enabled: false },
			};
			if (techniques[technique] !== undefined) {
				techniques[technique] = { enabled: true };
			}
			return techniques;
		};

		// Transform CSV data to BreathingPattern schema
		const breathingPatterns = data.map((row) => {
			const duration = parseInt(row.duration, 10) || 5;
			const cycles = parseInt(row.holdRatioCycles, 10) || 5;
			const energyEffect = energyEffectMap[row.energyEffect?.toLowerCase()] || "balancing";

			return {
				romanizationName: row.name?.trim(),
				iastName: row.name?.trim(), // No IAST column in CSV, use romanization name
				sanskritName: row.sanskritName?.trim(),
				description: `${row.name?.trim()} is a pranayama technique. ${
					row.benefits ? `Benefits include: ${row.benefits.replace(/,/g, ", ")}.` : ""
				}`,
				difficulty: row.difficulty?.trim() || "beginner",
				patternType: "ratio_based",
				patternRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
				vkTechniques: buildVkTechniques(row.technique?.trim()),
				benefits: row.benefits
					? row.benefits
							.split(",")
							.map((b) => b.trim())
							.filter(Boolean)
					: [],
				contraindications:
					row.contraindications && row.contraindications !== "none"
						? row.contraindications
								.split(";")
								.map((c) => c.trim())
								.filter(Boolean)
						: [],
				energyEffect,
				recommendedPractice: {
					measureBy: "cycles",
					durationMinutes: {
						min: duration - 2,
						max: duration + 5,
						default: duration,
					},
					cycles: {
						min: Math.max(3, cycles - 2),
						max: cycles + 5,
						default: cycles,
					},
				},
				isSystemPattern: row.isSystemPattern === "true",
			};
		});

		// Insert into database
		await BreathingPattern.insertMany(breathingPatterns);
		console.log(`✅ Seeded ${breathingPatterns.length} breathing patterns from CSV`);
	} catch (error) {
		console.error("❌ Error seeding breathing patterns:", error.message);
		throw error;
	}
}

module.exports = seedBreathingPatterns;
