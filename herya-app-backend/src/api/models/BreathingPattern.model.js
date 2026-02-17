const mongoose = require("mongoose");

const breathingPatternSchema = new mongoose.Schema(
	{
		// IDENTIFICATION
		romanizationName: { type: String, required: true, trim: true },
		iastName: { type: String, required: true, trim: true }, // IAST transliteration
		sanskritName: { type: String, required: true, trim: true }, // in Devanagari script
		alias: [{ type: String, trim: true }],
		description: {
			type: String,
			required: true,
			trim: true,
		},
		// CLASIFICATION
		difficulty: {
			type: String,
			enum: ["beginner", "intermediate", "advanced"],
			default: "beginner",
			required: true,
		},
		// BREATHING PATTERN
		pattern: {
			inhale: {
				type: Number,
				required: true,
				min: 0,
				default: 5, // seconds
			},
			hold: {
				type: Number,
				required: true,
				min: 0,
				default: 0,
			},
			exhale: {
				type: Number,
				required: true,
				min: 0,
				default: 5,
			},
			holdAfterExhale: {
				type: Number,
				required: true,
				min: 0,
				default: 0,
			},
		},
		// CYCLES
		defaultCycles: {
			type: Number,
			min: 1,
			default: 5,
		},
		// BENEFITS AND CONTRAINDICATIONS
		benefits: [
			{
				type: String,
				trim: true,
			},
		],
		contraindications: [
			{
				type: String,
				trim: true,
			},
		],
		warnings: {
			type: String,
			trim: true,
		},

		// BREATHING TECHNIQUES
		techniques: {
			alternatingNostrils: {
				type: Boolean,
				default: false,
			},
			rapid: {
				type: Boolean,
				default: false, // eg: Kapalabhati
			},
			continuous: {
				type: Boolean,
				default: false, // eg: Ujjayi
			},
			vocal: {
				type: Boolean,
				default: false, // eg: Om chanting, Bhramari
			},
		},

		// UI/UX
		visualType: {
			type: String,
			enum: ["circle", "square", "wave", "nostril", "pulse", "continuous-wave"],
			default: "circle",
		},

		soundCue: {
			type: String,
			enum: ["bell", "tone", "voice", "ocean", "click", "none"],
			default: "bell",
		},

		// EFFECTS
		energyEffect: {
			type: String,
			enum: ["calming", "energizing", "balancing", "cooling", "heating"],
			required: true,
		},
		bestTimeOfDay: [
			{
				type: String,
				enum: ["morning", "afternoon", "evening", "night", "anytime"],
			},
		],
		recommendedDuration: {
			min: { type: Number, default: 3 }, // minutes
			max: { type: Number, default: 10 },
		},
		// METADATA
		tags: [
			{
				type: String,
				trim: true,
			},
		],
		isSystemPattern: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

// INDEX
breathingPatternSchema.index({ romanizationName: 1 });
breathingPatternSchema.index({ difficulty: 1, energyEffect: 1 });
breathingPatternSchema.index({ tags: 1 });

const BreathingPattern = mongoose.model(
	"BreathingPattern",
	breathingPatternSchema,
);

module.exports = BreathingPattern;
