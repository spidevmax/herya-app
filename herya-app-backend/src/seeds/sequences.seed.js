const VKSequence = require("../api/models/VinyasaKramaSequence.model");

/**
 * Seed VK Sequences with hardcoded data matching the VinyasaKramaSequence model.
 * The sequences.csv is retained for reference but is not compatible with the VKSequence
 * schema (which requires family, level (number), sanskritName, englishName).
 */
async function seedSequences() {
	try {
		// Check if sequences already exist
		const existingSequences = await VKSequence.countDocuments();
		if (existingSequences > 0) {
			console.log("⏭️  Sequences already seeded, skipping...");
			return;
		}

		const sequences = [
			// ── Tadasana Family ────────────────────────────────────────────
			{
				family: "tadasana",
				level: 1,
				difficulty: "beginner",
				sanskritName: "ताडासन परिवार स्तर १",
				englishName: "Tadasana Family - Level 1",
				description:
					"Foundation mountain pose family. Develops foot awareness, upright posture and basic breath integration. Entry point to Vinyasa Krama.",
				estimatedDuration: { min: 20, max: 35, recommended: 25 },
				therapeuticFocus: {
					primaryBenefit: "Foundation awareness and postural alignment",
				},
			},
			{
				family: "tadasana",
				level: 2,
				difficulty: "intermediate",
				sanskritName: "ताडासन परिवार स्तर २",
				englishName: "Tadasana Family - Level 2",
				description:
					"Intermediate mountain pose variations. Expands into arm movements, balance and lateral extensions from the centred standing base.",
				estimatedDuration: { min: 25, max: 45, recommended: 35 },
				therapeuticFocus: {
					primaryBenefit: "Balance and spinal lateral extension",
				},
			},
			{
				family: "tadasana",
				level: 3,
				difficulty: "advanced",
				sanskritName: "ताडासन परिवार स्तर ३",
				englishName: "Tadasana Family - Level 3",
				description:
					"Advanced mountain pose family. Includes full arm balances, deep hip openers and complex vinyasa transitions from Tadasana.",
				estimatedDuration: { min: 40, max: 70, recommended: 55 },
				therapeuticFocus: {
					primaryBenefit: "Full body integration and advanced balance",
				},
			},
			// ── Standing Asymmetric Family ──────────────────────────────────
			{
				family: "standing_asymmetric",
				level: 1,
				difficulty: "beginner",
				sanskritName: "विरभद्रासन परिवार स्तर १",
				englishName: "Standing Asymmetric Family - Level 1",
				description:
					"Warrior and triangle family for beginners. Builds hip flexibility, leg strength and introduces asymmetric standing work.",
				estimatedDuration: { min: 25, max: 40, recommended: 30 },
				therapeuticFocus: {
					primaryBenefit: "Hip flexibility and leg strengthening",
				},
			},
			{
				family: "standing_asymmetric",
				level: 2,
				difficulty: "intermediate",
				sanskritName: "विरभद्रासन परिवार स्तर २",
				englishName: "Standing Asymmetric Family - Level 2",
				description:
					"Intermediate warrior sequences with extended holds and revolved variations. Deepens hip opening and builds endurance.",
				estimatedDuration: { min: 35, max: 55, recommended: 45 },
				therapeuticFocus: {
					primaryBenefit: "Hip opening and spinal rotation",
				},
			},
			// ── Seated Family ───────────────────────────────────────────────
			{
				family: "seated",
				level: 1,
				difficulty: "beginner",
				sanskritName: "उपविष्ट परिवार स्तर १",
				englishName: "Seated Family - Level 1",
				description:
					"Fundamental seated poses for hip and hamstring preparation. Includes forward folds, simple twists and grounding seated postures.",
				estimatedDuration: { min: 20, max: 35, recommended: 28 },
				therapeuticFocus: {
					primaryBenefit: "Hamstring flexibility and hip opening",
				},
			},
			{
				family: "seated",
				level: 2,
				difficulty: "intermediate",
				sanskritName: "उपविष्ट परिवार स्तर २",
				englishName: "Seated Family - Level 2",
				description:
					"Intermediate seated practice. Deeper forward bends, lateral stretches and more complex hip openers with pranayama integration.",
				estimatedDuration: { min: 30, max: 50, recommended: 40 },
				therapeuticFocus: {
					primaryBenefit: "Deep hip mobility and spinal flexibility",
				},
			},
			// ── Supine Family ───────────────────────────────────────────────
			{
				family: "supine",
				level: 1,
				difficulty: "beginner",
				sanskritName: "शयन परिवार स्तर १",
				englishName: "Supine Family - Level 1",
				description:
					"Restorative and accessible lying-down poses. Ideal for beginners, cool-down or therapeutic practice. Includes bridge, knee-to-chest and Savasana.",
				estimatedDuration: { min: 20, max: 40, recommended: 30 },
				therapeuticFocus: {
					primaryBenefit: "Relaxation, hip release and nervous system restoration",
				},
			},
			{
				family: "supine",
				level: 2,
				difficulty: "intermediate",
				sanskritName: "शयन परिवार स्तर २",
				englishName: "Supine Family - Level 2",
				description:
					"Intermediate supine work including wheel pose, deep backbends and supine twists. Strengthens the spine and opens the chest.",
				estimatedDuration: { min: 30, max: 50, recommended: 38 },
				therapeuticFocus: {
					primaryBenefit: "Back strengthening and chest opening",
				},
			},
			// ── Inverted Family ─────────────────────────────────────────────
			{
				family: "inverted",
				level: 2,
				difficulty: "intermediate",
				sanskritName: "विपरीत परिवार स्तर २",
				englishName: "Inverted Family - Level 2",
				description:
					"Shoulder stand and supported inversions. Builds shoulder stability, stimulates the thyroid and provides deep reversal of gravitational flow.",
				estimatedDuration: { min: 25, max: 45, recommended: 35 },
				therapeuticFocus: {
					primaryBenefit: "Inversion benefits and shoulder strengthening",
				},
			},
			{
				family: "inverted",
				level: 3,
				difficulty: "advanced",
				sanskritName: "विपरीत परिवार स्तर ३",
				englishName: "Inverted Family - Level 3",
				description:
					"Advanced inversions including headstand and arm balances. Requires strong shoulder base and core stability. Profoundly energising.",
				estimatedDuration: { min: 35, max: 60, recommended: 50 },
				therapeuticFocus: {
					primaryBenefit: "Mental clarity and full inversion mastery",
				},
			},
			// ── Meditative Family ───────────────────────────────────────────
			{
				family: "meditative",
				level: 1,
				difficulty: "beginner",
				sanskritName: "ध्यान परिवार स्तर १",
				englishName: "Meditative Family - Level 1",
				description:
					"Seated meditation poses for beginners. Gentle hip openers leading into comfortable meditative sitting with pranayama and breath awareness.",
				estimatedDuration: { min: 20, max: 40, recommended: 30 },
				therapeuticFocus: {
					primaryBenefit: "Meditation preparation and breath awareness",
				},
			},
		];

		await VKSequence.insertMany(sequences);
		console.log(`✅ Seeded ${sequences.length} VK sequences`);
	} catch (error) {
		console.error("❌ Error seeding sequences:", error.message);
		throw error;
	}
}

module.exports = seedSequences;
