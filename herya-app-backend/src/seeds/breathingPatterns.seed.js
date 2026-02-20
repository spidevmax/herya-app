const BreathingPattern = require("../api/models/BreathingPattern.model");

async function seedBreathingPatterns() {
	try {
		// Check if patterns already exist
		const existingPatterns = await BreathingPattern.countDocuments();
		if (existingPatterns > 0) {
			console.log("⏭️  Breathing patterns already seeded, skipping...");
			return;
		}

		const breathingPatterns = [
			{
				name: "Ujjayi",
				sanskritName: "उज्जयी",
				description:
					"Victorious breath technique that creates a slight constriction in the throat",
				level: "beginner",
				pattern: {
					inhale: 4,
					hold: 0,
					exhale: 4,
					holdAfterExhale: 0,
				},
				benefits: [
					"Calms the mind",
					"Improves concentration",
					"Generates internal heat",
				],
				contraindications: ["High blood pressure during practice"],
				duration: 5,
			},
			{
				name: "Nadi Shodhana",
				sanskritName: "नाड़ी शोधन",
				description:
					"Alternate nostril breathing technique for balancing energy channels",
				level: "beginner",
				pattern: {
					inhale: 4,
					hold: 4,
					exhale: 4,
					holdAfterExhale: 0,
				},
				benefits: [
					"Balances nervous system",
					"Reduces anxiety",
					"Cleanses energy channels",
				],
				contraindications: ["Pregnancy (modify after first trimester)"],
				duration: 10,
			},
			{
				name: "Kapalabhati",
				sanskritName: "कपालभाति",
				description: "Skull-shining breath with forceful exhalation",
				level: "intermediate",
				pattern: {
					inhale: 2,
					hold: 0,
					exhale: 1,
					holdAfterExhale: 0,
				},
				benefits: [
					"Cleanses respiratory system",
					"Energizes body and mind",
					"Improves digestion",
				],
				contraindications: [
					"High blood pressure",
					"Heart conditions",
					"Pregnancy",
				],
				duration: 5,
			},
			{
				name: "Bhramari",
				sanskritName: "भ्रमरी",
				description: "Bee breath technique creating a humming sound",
				level: "intermediate",
				pattern: {
					inhale: 4,
					hold: 0,
					exhale: 8,
					holdAfterExhale: 0,
				},
				benefits: [
					"Calms mind",
					"Relieves stress and anxiety",
					"Improves voice",
				],
				contraindications: ["Pregnancy"],
				duration: 5,
			},
			{
				name: "Bhastrika",
				sanskritName: "भस्त्रिका",
				description: "Bellows breath with rapid inhalations and exhalations",
				level: "advanced",
				pattern: {
					inhale: 1,
					hold: 0,
					exhale: 1,
					holdAfterExhale: 0,
				},
				benefits: [
					"Energizes body",
					"Increases metabolism",
					"Cleanses lungs",
				],
				contraindications: [
					"High blood pressure",
					"Heart conditions",
					"Pregnancy",
				],
				duration: 3,
			},
			{
				name: "Anulom Vilom",
				sanskritName: "अनुलोम विलोम",
				description: "Alternate nostril breathing for relaxation and balance",
				level: "beginner",
				pattern: {
					inhale: 4,
					hold: 4,
					exhale: 4,
					holdAfterExhale: 4,
				},
				benefits: [
					"Reduces stress",
					"Improves sleep",
					"Balances hemispheres",
				],
				contraindications: [],
				duration: 10,
			},
		];

		await BreathingPattern.insertMany(breathingPatterns);
		console.log(`✅ Seeded ${breathingPatterns.length} breathing patterns`);
	} catch (error) {
		console.error("❌ Error seeding breathing patterns:", error);
		throw error;
	}
}

module.exports = seedBreathingPatterns;
