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

			// sidedness: use explicit column if present, otherwise derive from bilateral
			const bilateral = row.bilateral === "true";
			const sidednessType = row.sidedness?.trim() || (bilateral ? "both_sides" : "symmetric");

			return {
				name: row.name?.trim(),
				nameEs: row.nameEs?.trim() || undefined,
				romanizationName: row.romanizationName?.trim(),
				iastName: row.iastName?.trim(),
				sanskritName: row.sanskritName?.trim(),
				alias: parseArray(row.alias),
				aliasEs: parseArray(row.aliasEs),
				vkCategory: {
					primary: row.vkCategoryPrimary?.trim(),
				},
				category: categories,
				difficulty: row.difficulty?.trim() || "beginner",
				sidedness: {
					type: sidednessType,
				},
				drishti: row.drishti?.trim() || "none",
				vkContext: {
					appearsInFamilies: parseArray(row.vkFamilies),
					roleInSequence: row.roleInSequence?.trim() || "primary",
				},
				transitionType: row.transitionType?.trim() || "static",
				recommendedHoldSeconds: Math.min(parseInt(row.recommendedHoldDefault, 10) || 30, 300),
				targetMuscles: parseArray(row.targetMuscles),
				jointFocus: parseArray(row.jointFocus),
				chakraRelated: chakra || undefined,
				energyEffect: row.energyEffect?.trim() || undefined,
				benefits: parseArray(row.benefits),
				benefitsEs: parseArray(row.benefitsEs),
				contraindications: parseArray(row.contraindications),
				contraindicationsEs: parseArray(row.contraindicationsEs),
				commonMistakes: parseArray(row.commonMistakes),
				commonMistakesEs: parseArray(row.commonMistakesEs),
				breathingCue: row.breathingCue?.trim(),
				breathingCueEs: row.breathingCueEs?.trim() || undefined,
				tags: parseArray(row.tags),
				isSystemPose: row.isSystemPose === "true",
			};
		});

		// Upsert by romanizationName — updates existing poses with latest seed data
		const ops = poses.map((pose) => ({
			updateOne: {
				filter: { romanizationName: pose.romanizationName },
				update: { $set: pose },
				upsert: true,
			},
		}));
		const result = await Pose.bulkWrite(ops);
		console.log(
			`✅ Poses seeded: ${result.upsertedCount} inserted, ${result.modifiedCount} updated`,
		);
	} catch (error) {
		console.error("❌ Error seeding poses:", error.message);
		throw error;
	}
}

module.exports = seedPoses;
