const Sequence = require("../api/models/Sequence.model");
const Pose = require("../api/models/Pose.model");
const BreathingPattern = require("../api/models/BreathingPattern.model");

async function seedSequences() {
	try {
		// Check if sequences already exist
		const existingSequences = await Sequence.countDocuments();
		if (existingSequences > 0) {
			console.log("⏭️  Sequences already seeded, skipping...");
			return;
		}

		// Get some poses and breathing patterns from DB
		const poses = await Pose.find().limit(10);
		const breathingPatterns = await BreathingPattern.find().limit(2);

		if (poses.length === 0 || breathingPatterns.length === 0) {
			console.log("⏭️  Skipping sequences seed - poses or breathing patterns not found");
			return;
		}

		const sequences = [
			{
				title: "Morning Energy Flow",
				description: "Energizing morning sequence to start your day with vitality",
				level: "beginner",
				style: "vinyasa",
				estimatedDuration: 30,
				blocks: [
					{
						type: "pranayama",
						duration: 5,
						breathingPattern: breathingPatterns[0]._id,
						description: "Warm up with energizing breathing",
					},
					{
						type: "poses",
						duration: 20,
						description: "Flowing sequence of sun salutations and standing poses",
						poses: poses.slice(0, 3).map((pose) => ({
							pose: pose._id,
							duration: 5,
							order: 1,
						})),
					},
					{
						type: "meditation",
						duration: 5,
						description: "Brief centering meditation",
					},
				],
				difficulty: "beginner",
				focusAreas: ["energy", "strength", "flexibility"],
			},
			{
				title: "Evening Relaxation",
				description: "Calming sequence to unwind and prepare for sleep",
				level: "beginner",
				style: "restorative",
				estimatedDuration: 40,
				blocks: [
					{
						type: "pranayama",
						duration: 5,
						breathingPattern: breathingPatterns[1]._id,
						description: "Calm breathing to relax",
					},
					{
						type: "poses",
						duration: 25,
						description: "Gentle restorative poses",
						poses: poses.slice(3, 6).map((pose) => ({
							pose: pose._id,
							duration: 7,
							order: 1,
						})),
					},
					{
						type: "meditation",
						duration: 10,
						description: "Deep relaxation meditation",
					},
				],
				difficulty: "beginner",
				focusAreas: ["relaxation", "flexibility", "calm"],
			},
			{
				title: "Core Strength Builder",
				description: "Intermediate sequence focused on building core strength",
				level: "intermediate",
				style: "power",
				estimatedDuration: 45,
				blocks: [
					{
						type: "pranayama",
						duration: 5,
						breathingPattern: breathingPatterns[0]._id,
						description: "Energizing warm-up breath",
					},
					{
						type: "poses",
						duration: 35,
						description: "Strong core-focused poses",
						poses: poses.slice(0, 5).map((pose, idx) => ({
							pose: pose._id,
							duration: 6,
							order: idx + 1,
						})),
					},
					{
						type: "meditation",
						duration: 5,
						description: "Brief cool-down meditation",
					},
				],
				difficulty: "intermediate",
				focusAreas: ["strength", "core", "power"],
			},
			{
				title: "Full Body Flexibility",
				description: "Comprehensive sequence to improve overall flexibility",
				level: "intermediate",
				style: "hatha",
				estimatedDuration: 50,
				blocks: [
					{
						type: "pranayama",
						duration: 5,
						breathingPattern: breathingPatterns[1]._id,
						description: "Balanced breathing",
					},
					{
						type: "poses",
						duration: 35,
						description: "Poses targeting all major muscle groups",
						poses: poses.map((pose, idx) => ({
							pose: pose._id,
							duration: 3,
							order: idx + 1,
						})),
					},
					{
						type: "meditation",
						duration: 10,
						description: "Extended relaxation",
					},
				],
				difficulty: "intermediate",
				focusAreas: ["flexibility", "balance", "strength"],
			},
		];

		await Sequence.insertMany(sequences);
		console.log(`✅ Seeded ${sequences.length} sequences`);
	} catch (error) {
		console.error("❌ Error seeding sequences:", error);
		throw error;
	}
}

module.exports = seedSequences;
