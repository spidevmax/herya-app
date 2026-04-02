const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const VKSequence = require("../api/models/VinyasaKramaSequence.model");
const Pose = require("../api/models/Pose.model");

/**
 * Seed VK Sequences from CSV file
 * Reads sequences.csv and populates VKSequence collection
 */
const DIFFICULTY_RANK = {
	beginner: 1,
	intermediate: 2,
	advanced: 3,
};

const CORE_POSES_PER_LEVEL = {
	1: 4,
	2: 6,
	3: 8,
};

const FAMILY_ENTRY_POSE = {
	tadasana: "tadasana",
	standing_asymmetric: "tadasana",
	standing_symmetric: "tadasana",
	one_leg_standing: "tadasana",
	triangle_sequence: "tadasana",
	sun_salutation: "tadasana",
	seated: "vajrasana",
	meditative: "vajrasana",
	lotus_variations: "vajrasana",
	vajrasana_variations: "vajrasana",
	supine: "savasana",
	prone: "balasana",
	bow_sequence: "balasana",
	inverted: "adho mukha svanasana",
};

const FAMILY_EXIT_POSE = {
	tadasana: "tadasana",
	standing_asymmetric: "tadasana",
	standing_symmetric: "tadasana",
	one_leg_standing: "tadasana",
	triangle_sequence: "tadasana",
	sun_salutation: "tadasana",
	seated: "savasana",
	meditative: "savasana",
	lotus_variations: "savasana",
	vajrasana_variations: "savasana",
	supine: "savasana",
	prone: "balasana",
	bow_sequence: "balasana",
	inverted: "savasana",
};

const normalize = (value) =>
	String(value || "")
		.trim()
		.toLowerCase();

const getPoseDifficultyRank = (pose) =>
	DIFFICULTY_RANK[normalize(pose?.difficulty)] || 1;

const getRecommendedBreaths = (pose, sequenceDifficulty) => {
	const difficultyKey = normalize(sequenceDifficulty);
	const range = pose?.recommendedBreaths?.[difficultyKey];
	if (range?.min) return Math.max(3, range.min);
	return 5;
};

const buildPoseIndex = (poses) => {
	const byRomanization = new Map();
	const byName = new Map();

	poses.forEach((pose) => {
		const romanizationName = normalize(pose.romanizationName);
		const name = normalize(pose.name);

		if (romanizationName && !byRomanization.has(romanizationName)) {
			byRomanization.set(romanizationName, pose);
		}
		if (name && !byName.has(name)) {
			byName.set(name, pose);
		}
	});

	return { byRomanization, byName };
};

const getPoseByName = (poseIndex, poseName) => {
	const key = normalize(poseName);
	if (!key) return null;
	return poseIndex.byRomanization.get(key) || poseIndex.byName.get(key) || null;
};

const pickFamilyPoses = (allPoses, family, difficulty) => {
	const targetRank = DIFFICULTY_RANK[normalize(difficulty)] || 1;
	const familyPoses = allPoses.filter((pose) =>
		Array.isArray(pose?.vkContext?.appearsInFamilies)
			? pose.vkContext.appearsInFamilies.includes(family)
			: false,
	);

	const eligibleFamilyPoses = familyPoses.filter(
		(pose) => getPoseDifficultyRank(pose) <= targetRank,
	);

	if (eligibleFamilyPoses.length > 0) {
		return eligibleFamilyPoses;
	}

	if (familyPoses.length > 0) {
		return familyPoses;
	}

	return allPoses.filter((pose) => getPoseDifficultyRank(pose) <= targetRank);
};

const sortPosesForSequence = (poses, targetDifficulty) => {
	const targetRank = DIFFICULTY_RANK[normalize(targetDifficulty)] || 1;

	return [...poses].sort((a, b) => {
		const aRole = normalize(a?.vkContext?.roleInSequence);
		const bRole = normalize(b?.vkContext?.roleInSequence);
		const roleScore = (role) => {
			if (role === "primary") return 0;
			if (role === "transition") return 1;
			if (role === "preparation") return 2;
			if (role === "counterpose") return 3;
			return 4;
		};

		const aRoleScore = roleScore(aRole);
		const bRoleScore = roleScore(bRole);
		if (aRoleScore !== bRoleScore) return aRoleScore - bRoleScore;

		const aDiff = Math.abs(getPoseDifficultyRank(a) - targetRank);
		const bDiff = Math.abs(getPoseDifficultyRank(b) - targetRank);
		if (aDiff !== bDiff) return aDiff - bDiff;

		return String(a.name || "").localeCompare(String(b.name || ""));
	});
};

const uniquePoses = (poses) => {
	const seen = new Set();
	return poses.filter((pose) => {
		const id = String(pose?._id || "");
		if (!id || seen.has(id)) return false;
		seen.add(id);
		return true;
	});
};

const buildStructure = (row, allPoses, poseIndex) => {
	const level = Number(row.level) || 1;
	const difficulty = normalize(row.difficulty) || "beginner";
	const coreLimit = CORE_POSES_PER_LEVEL[level] || 4;

	const familyPool = pickFamilyPoses(allPoses, row.family, difficulty);
	const coreCandidates = uniquePoses(
		sortPosesForSequence(familyPool, difficulty),
	);
	const corePoses = coreCandidates.slice(0, coreLimit).map((pose, index) => ({
		pose: pose._id,
		order: index + 1,
		breaths: getRecommendedBreaths(pose, difficulty),
		vinyasaTransition: index === 0 ? "direct" : "half",
	}));

	const defaultEntry = getPoseByName(poseIndex, FAMILY_ENTRY_POSE[row.family]);
	const defaultExit = getPoseByName(poseIndex, FAMILY_EXIT_POSE[row.family]);
	const fallbackStart = coreCandidates[0] || null;
	const fallbackEnd = coreCandidates[coreCandidates.length - 1] || null;

	const entryPose = defaultEntry || fallbackStart;
	const exitPose = defaultExit || fallbackEnd;

	return {
		entry: {
			fromPose: entryPose?._id || null,
			steps: entryPose
				? [
						{
							instruction: `Enter from ${entryPose.romanizationName || entryPose.name}`,
							pose: entryPose._id,
							breaths: 3,
						},
					]
				: [],
		},
		corePoses,
		exit: {
			toPose: exitPose?._id || null,
			steps: exitPose
				? [
						{
							instruction: `Return to ${exitPose.romanizationName || exitPose.name}`,
							pose: exitPose._id,
							breaths: 3,
						},
					]
				: [],
		},
	};
};

const buildProgressionUpdates = (sequences) => {
	const groupedByFamily = sequences.reduce((acc, sequence) => {
		if (!acc.has(sequence.family)) {
			acc.set(sequence.family, []);
		}
		acc.get(sequence.family).push(sequence);
		return acc;
	}, new Map());

	const progressionOps = [];

	groupedByFamily.forEach((familySequences) => {
		const ordered = [...familySequences].sort((a, b) => a.level - b.level);

		ordered.forEach((sequence, index) => {
			const previous = ordered[index - 1] || null;
			const next = ordered[index + 1] || null;

			progressionOps.push({
				updateOne: {
					filter: { _id: sequence._id },
					update: {
						$set: {
							prerequisites: previous ? [previous._id] : [],
							nextSteps: next
								? [
										{
											sequence: next._id,
											description: `Progress to ${next.englishName}`,
										},
									]
								: [],
						},
					},
				},
			});
		});
	});

	return progressionOps;
};

async function seedSequences() {
	try {
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

		const allPoses = await Pose.find({ isSystemPose: true })
			.select(
				"_id name romanizationName difficulty vkContext recommendedBreaths",
			)
			.lean();

		const poseIndex = buildPoseIndex(allPoses);

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

			// VK STRUCTURE (complete seed)
			structure: buildStructure(row, allPoses, poseIndex),

			// METADATA
			tags: toArray(row.tags),
			isSystemSequence:
				row.isSystemSequence !== false && row.isSystemSequence !== "false",
		}));

		// Upsert by family+level — writes full payload so structure stays synced with seeds.
		const ops = sequences.map((seq) => ({
			updateOne: {
				filter: { family: seq.family, level: seq.level },
				update: { $set: seq },
				upsert: true,
			},
		}));
		const result = await VKSequence.bulkWrite(ops);

		const seededSequences = await VKSequence.find({
			family: { $in: [...new Set(sequences.map((seq) => seq.family))] },
			level: { $in: [...new Set(sequences.map((seq) => seq.level))] },
		})
			.select("_id family level englishName")
			.lean();

		const progressionOps = buildProgressionUpdates(seededSequences);
		if (progressionOps.length > 0) {
			await VKSequence.bulkWrite(progressionOps);
		}

		console.log(
			`✅ Sequences seeded: ${result.upsertedCount} inserted, ${result.matchedCount} updated, structure + progression linked`,
		);
	} catch (error) {
		console.error("❌ Error seeding sequences:", error.message);
		throw error;
	}
}

module.exports = seedSequences;
