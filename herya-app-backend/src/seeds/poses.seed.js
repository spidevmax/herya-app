const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const Pose = require("../api/models/Pose.model");

/**
 * Seed Poses from CSV file
 * Reads poses.csv and populates Pose collection
 */
async function seedPoses() {
	try {
		const existingPoses = await Pose.countDocuments();
		if (existingPoses > 0) {
			console.log("⏭️  Poses already seeded, skipping...");
			return;
		}

		const csvPath = path.join(__dirname, "data", "poses.csv");
		const csvContent = fs.readFileSync(csvPath, "utf-8");

		const { data, errors } = Papa.parse(csvContent, {
			header: true,
			dynamicTyping: false,
			skipEmptyLines: true,
		});

		if (errors.length > 0) {
			throw new Error(`CSV parsing errors: ${errors.map((e) => e.message).join(", ")}`);
		}

		const parseArray = (str, separator = "|") =>
			str
				? str
						.split(separator)
						.map((s) => s.trim())
						.filter(Boolean)
				: [];

		const poses = data.map((row) => {
			// Parse categories - split by | and filter valid enum values
			const validCategories = [
				"standing",
				"sitting_meditation",
				"reclining",
				"inverted",
				"balancing",
				"forward_bend",
				"backbend",
				"twisting",
				"hip_opening",
				"core_strength",
				"arm_balance",
				"restorative",
			];
			const categories = parseArray(row.category).filter((c) => validCategories.includes(c));

			// chakraRelated is a single value - take first if pipe-separated
			const chakra = row.chakraRelated ? row.chakraRelated.split("|")[0].trim() : undefined;

			// sidedness derived from bilateral column
			const bilateral = row.bilateral === "true";

			return {
				name: row.name?.trim(),
				romanizationName: row.romanizationName?.trim(),
				iastName: row.iastName?.trim(),
				sanskritName: row.sanskritName?.trim(),
				alias: parseArray(row.alias),
				vkCategory: {
					primary: row.vkCategoryPrimary?.trim(),
				},
				category: categories,
				difficulty: row.difficulty?.trim() || "beginner",
				sidedness: {
					type: bilateral ? "both_sides" : "symmetric",
				},
				transitionType: row.transitionType?.trim() || "static",
				recommendedHoldSeconds: Math.min(parseInt(row.recommendedHoldDefault, 10) || 30, 300),
				targetMuscles: parseArray(row.targetMuscles),
				jointFocus: parseArray(row.jointFocus),
				chakraRelated: chakra || undefined,
				energyEffect: row.energyEffect?.trim() || undefined,
				benefits: parseArray(row.benefits),
				contraindications: parseArray(row.contraindications),
				commonMistakes: parseArray(row.commonMistakes),
				breathingCue: row.breathingCue?.trim(),
				tags: parseArray(row.tags),
				isSystemPose: row.isSystemPose === "true",
			};
		});

		await Pose.insertMany(poses);
		console.log(`✅ Seeded ${poses.length} poses from CSV`);
	} catch (error) {
		console.error("❌ Error seeding poses:", error.message);
		throw error;
	}
}

module.exports = seedPoses;
