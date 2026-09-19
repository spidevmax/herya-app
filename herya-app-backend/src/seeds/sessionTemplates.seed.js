const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const SessionTemplate = require("../api/models/SessionTemplate.model");
const ChildProfile = require("../api/models/ChildProfile.model");
const User = require("../api/models/User.model");
const VKSequence = require("../api/models/VinyasaKramaSequence.model");
const BreathingPattern = require("../api/models/BreathingPattern.model");

/**
 * Seed SessionTemplates from CSV file.
 *
 * The CSV is normalised one row per BLOCK, grouped by `templateKey`:
 * a template with three blocks spans three rows sharing the same key.
 * References are resolved by natural key (user email, child name,
 * sequence family+level, breathing pattern name) instead of ObjectIds.
 */
async function seedSessionTemplates() {
	try {
		const existingTemplates = await SessionTemplate.countDocuments();
		if (existingTemplates > 0) {
			console.log("⏭️  Session templates already seeded, skipping...");
			return;
		}

		// Read CSV file
		const csvPath = path.join(__dirname, "data", "sessionTemplates.csv");
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

		// Build lookup maps for every reference the CSV points at
		const users = await User.find({}, { _id: 1, email: 1 }).lean();
		const userIdByEmail = new Map(users.map((user) => [user.email, user._id]));

		const children = await ChildProfile.find({}, { _id: 1, name: 1 }).lean();
		const childIdByName = new Map(children.map((child) => [child.name, child._id]));

		const sequences = await VKSequence.find({}, { _id: 1, family: 1, level: 1 }).lean();
		const sequenceIdByKey = new Map(
			sequences.map((sequence) => [`${sequence.family}:${sequence.level}`, sequence._id]),
		);

		const patterns = await BreathingPattern.find({}, { _id: 1, romanizationName: 1 }).lean();
		const patternIdByName = new Map(
			patterns.map((pattern) => [pattern.romanizationName, pattern._id]),
		);

		// Group rows by templateKey, preserving CSV order
		const templatesByKey = new Map();
		for (const row of data) {
			if (!templatesByKey.has(row.templateKey)) {
				templatesByKey.set(row.templateKey, []);
			}
			templatesByKey.get(row.templateKey).push(row);
		}

		let count = 0;
		for (const [templateKey, rows] of templatesByKey) {
			const [first] = rows;

			const userId = userIdByEmail.get(first.userEmail);
			if (!userId) {
				console.log(`⚠️  Skipping '${templateKey}' – user ${first.userEmail} not found`);
				continue;
			}

			const blocks = [];
			let skipTemplate = false;

			for (const row of rows) {
				const block = {
					blockType: row.blockType,
					label: row.label,
					durationMinutes: parseInt(row.durationMinutes, 10),
					order: parseInt(row.order, 10),
					guided: row.guided !== "false",
					level: row.level || "beginner",
				};

				if (row.blockType === "vk_sequence") {
					const sequenceId = sequenceIdByKey.get(`${row.sequenceFamily}:${row.sequenceLevel}`);
					if (!sequenceId) {
						console.log(
							`⚠️  Skipping '${templateKey}' – sequence ${row.sequenceFamily} level ${row.sequenceLevel} not found`,
						);
						skipTemplate = true;
						break;
					}
					block.vkSequence = sequenceId;
				}

				if (row.blockType === "pranayama") {
					const patternId = patternIdByName.get(row.breathingPattern);
					if (!patternId) {
						console.log(
							`⚠️  Skipping '${templateKey}' – breathing pattern ${row.breathingPattern} not found`,
						);
						skipTemplate = true;
						break;
					}
					block.breathingPattern = patternId;
				}

				if (row.blockType === "meditation") {
					block.meditationType = row.meditationType || undefined;
				}

				blocks.push(block);
			}

			if (skipTemplate) continue;

			const templateData = {
				user: userId,
				name: first.name,
				sessionType: first.sessionType,
				preset: first.preset || "adult",
				blocks,
				totalMinutes: blocks.reduce((total, block) => total + block.durationMinutes, 0),
				usageCount: parseInt(first.usageCount, 10) || 0,
			};

			// Optional child link — only tutor presets carry one
			if (first.childName) {
				const childId = childIdByName.get(first.childName);
				if (childId) {
					templateData.childProfile = childId;
				} else {
					console.log(`⚠️  Child '${first.childName}' not found for '${templateKey}'`);
				}
			}

			const template = new SessionTemplate(templateData);
			await template.save();
			count++;
		}

		console.log(`✅ Seeded ${count} session templates from CSV`);
	} catch (error) {
		console.error("❌ Error seeding session templates:", error.message);
		throw error;
	}
}

module.exports = seedSessionTemplates;
