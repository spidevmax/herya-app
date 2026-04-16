/**
 * @schema BreathingPattern
 * @description Model for pranayama (breathing) techniques within Vinyasa Krama
 *
 * Manages all information about breathing techniques including:
 * - Breathing patterns (ratios, timing, counts)
 * - VK-specific techniques (Nadi Shodhana, Kapalabhati, Bhastrika, Ujjayi, etc.)
 * - Bandhas and Mudras (locks and hand gestures)
 * - VK context (when to practice, before which families)
 * - Teaching information (step-by-step instructions, common mistakes)
 * - Benefits and contraindications
 *
 * Key Features:
 * - Supports 3 pattern types: ratio-based (preferred), time-based, count-based
 * - Flexible ratios: e.g. 1:0:2:0 (Ujjayi), 1:4:2:0 (Nadi Shodhana), 1:1:1:1 (Sama Vritti)
 * - Complete VK integration: practice phases, recommended families, prerequisites
 * - Domain validation via pre-validate hooks (ratio consistency, min/max/default ranges)
 * - Virtuals: calculatedPattern (actual seconds per phase), totalCycleDuration (full cycle in seconds) — only meaningful for ratio_based and time_based patterns
 * - Methods: getRatioString(), estimatePracticeDuration(cycles), isSafeForLevel(userLevel)
 *
 * Relationships:
 * - Referenced by: Session.completePractice.pranayama
 * - Self-reference: prerequisiteBreathing (technique progression)
 *
 * @example
 * // Create Ujjayi technique (Ocean Breath) — traditional 1:0:2:0 ratio (extended exhale)
 * const ujjayi = new BreathingPattern({
 *   romanizationName: "Ujjayi",
 *   sanskritName: "उज्जयी",
 *   iastName: "Ujjāyī",
 *   difficulty: "beginner",
 *   patternType: "ratio_based",
 *   patternRatio: { inhale: 1, hold: 0, exhale: 2, holdAfterExhale: 0 },
 *   baseBreathDuration: 5,
 *   vkTechniques: { ujjayi: { enabled: true, withSound: true } },
 *   energyEffect: "calming"
 * });
 *
 * @example
 * // Get ratio as string
 * const ratioStr = breathingPattern.getRatioString(); // "1:0:2:0"
 * // Calculate actual breath times (baseBreathDuration = 5s)
 * const times = breathingPattern.calculatedPattern; // { inhale: 5, hold: 0, exhale: 10, holdAfterExhale: 0 }
 */
const mongoose = require("mongoose");

const breathingPatternSchema = new mongoose.Schema(
	{
		// IDENTIFICATION
		romanizationName: {
			type: String,
			required: true,
			trim: true,
			unique: true,
		},
		iastName: {
			type: String,
			required: true,
			trim: true,
		},
		sanskritName: {
			type: String,
			required: true,
			trim: true,
		},
		alias: [
			{
				type: String,
				trim: true,
			},
		],
		description: {
			type: String,
			required: true,
			trim: true,
		},
		descriptionEs: { type: String, trim: true },

		// CLASSIFICATION
		difficulty: {
			type: String,
			enum: ["beginner", "intermediate", "advanced"],
			default: "beginner",
			required: true,
		},

		// BREATHING PATTERN
		patternType: {
			type: String,
			enum: ["ratio_based", "time_based", "count_based"],
			default: "ratio_based",
		},

		// For patterns based on ratio (preferred in VK)
		patternRatio: {
			inhale: {
				type: Number,
				default: 1,
				min: 0,
				max: 10,
			},
			hold: {
				type: Number,
				default: 0,
				min: 0,
				max: 10,
			},
			exhale: {
				type: Number,
				default: 1,
				min: 0,
				max: 10,
			},
			holdAfterExhale: {
				type: Number,
				default: 0,
				min: 0,
				max: 10,
			},
		},

		// Base duration (multiplier for the ratio)
		baseBreathDuration: {
			type: Number,
			default: 5, // seconds per ratio unit
			min: 3,
			max: 10,
		},

		// For patterns based on absolute time (legacy support)
		patternTime: {
			inhale: {
				type: Number,
				default: 5,
				min: 0,
				max: 60,
			},
			hold: {
				type: Number,
				default: 0,
				min: 0,
				max: 60,
			},
			exhale: {
				type: Number,
				default: 5,
				min: 0,
				max: 60,
			},
			holdAfterExhale: {
				type: Number,
				default: 0,
				min: 0,
				max: 60,
			},
		},

		// RECOMMENDED PRACTICE
		recommendedPractice: {
			measureBy: {
				type: String,
				enum: ["time", "cycles", "either"],
				default: "cycles",
			},
			durationMinutes: {
				min: { type: Number, default: 3, min: 1, max: 60 },
				max: { type: Number, default: 10, min: 1, max: 120 },
				default: { type: Number, default: 5, min: 1, max: 60 },
			},
			cycles: {
				min: { type: Number, default: 5, min: 1, max: 500 },
				max: { type: Number, default: 20, min: 1, max: 1000 },
				default: { type: Number, default: 10, min: 1, max: 500 },
			},
		},

		// VK-SPECIFIC TECHNIQUES
		vkTechniques: {
			// Nadi Shodhana (Alternate Nostril Breathing)
			nadishodhana: {
				enabled: { type: Boolean, default: false },
				pattern: {
					type: String,
					enum: ["classic", "anuloma", "viloma", "pratiloma"],
				},
				nostrilSequence: [
					{
						type: String,
						enum: ["left", "right", "both"],
					},
				], // e.g. ['left', 'right', 'both']
			},

			// Kapalabhati (Skull Shining Breath)
			kapalabhati: {
				enabled: { type: Boolean, default: false },
				pumpingRate: { type: Number, min: 30, max: 120 }, // per minute
				rounds: { type: Number, default: 3, min: 1, max: 10 },
			},

			// Bhastrika (Bellows Breath)
			bhastrika: {
				enabled: { type: Boolean, default: false },
				intensity: {
					type: String,
					enum: ["gentle", "moderate", "vigorous"],
					default: "gentle",
				},
				rounds: { type: Number, default: 3, min: 1, max: 10 },
			},

			// Ujjayi (Ocean Breath)
			ujjayi: {
				enabled: { type: Boolean, default: false },
				withSound: { type: Boolean, default: true },
			},

			// Bhramari (Bee Breath)
			bhramari: {
				enabled: { type: Boolean, default: false },
				pitch: {
					type: String,
					enum: ["low", "medium", "high"],
					default: "medium",
				},
			},

			// Sitali / Sitkari (Cooling Breaths)
			cooling: {
				enabled: { type: Boolean, default: false },
				type: {
					type: String,
					enum: ["sitali", "sitkari"],
					default: "sitali",
				},
			},

			// Bandhas (Energy Locks) - CRUCIAL in VK
			bandhas: {
				mula: { type: Boolean, default: false }, // Root lock
				uddiyana: { type: Boolean, default: false }, // Abdominal lock
				jalandhara: { type: Boolean, default: false }, // Throat lock
				whenToApply: {
					type: String,
					enum: ["on_hold", "throughout", "on_exhale", "on_inhale", "none"],
					default: "none",
				},
			},

			// Mudras (Hand gestures)
			mudra: {
				type: String,
				enum: ["none", "jnana", "chin", "vishnu", "nasagra", "bhairava", "bhairavi"],
				default: "none",
			},
		},

		// BENEFITS AND CONTRAINDICATIONS
		benefits: [{ type: String, trim: true }],
		benefitsEs: [{ type: String, trim: true }],
		contraindications: [{ type: String, trim: true }],
		contraindicationsEs: [{ type: String, trim: true }],
		warnings: { type: String, trim: true },
		warningsEs: { type: String, trim: true },

		// VK CONTEXT
		vkContext: {
			// When in the practice?
			practicePhase: {
				type: String,
				enum: ["opening", "mid_practice", "closing", "anytime"],
				default: "opening",
			},

			// Before which families is this recommended?
			recommendedBefore: [
				{
					type: String,
					enum: [
						"tadasana",
						"standing_asymmetric",
						"standing_symmetric",
						"one_leg_standing",
						"seated",
						"supine",
						"prone",
						"inverted",
						"meditative",
						"bow_sequence",
						"triangle_sequence",
						"sun_salutation",
						"vajrasana_variations",
						"lotus_variations",
					],
				},
			],

			// Pranayama prerequisites
			prerequisiteBreathing: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: "BreathingPattern",
				},
			],

			// Suggested progression
			progressionNotes: { type: String, trim: true },
		},

		// TEACHING INFORMATION
		teaching: {
			setupInstructions: [{ type: String, trim: true }],
			stepByStep: [{ type: String, trim: true }],
			commonMistakes: [{ type: String, trim: true }],
			teachingPoints: [{ type: String, trim: true }],
			preparationTips: [{ type: String, trim: true }],
			safetyGuidelines: [{ type: String, trim: true }],
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

		// METADATA
		tags: [{ type: String, trim: true }],
		isSystemPattern: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		versionKey: false,
		toJSON: { virtuals: true }, // Important for virtuals to be included in API responses
		toObject: { virtuals: true }, // Important for virtuals to be included when converting to objects
	},
);

// VIRTUALS

// VIRTUAL: Calculate actual breath times from ratio
breathingPatternSchema.virtual("calculatedPattern").get(function () {
	if (this.patternType === "ratio_based") {
		return {
			inhale: this.patternRatio.inhale * this.baseBreathDuration,
			hold: this.patternRatio.hold * this.baseBreathDuration,
			exhale: this.patternRatio.exhale * this.baseBreathDuration,
			holdAfterExhale: this.patternRatio.holdAfterExhale * this.baseBreathDuration,
		};
	}
	return this.patternTime;
});

// VIRTUAL: Total duration of one full breath cycle (inhale + hold + exhale + holdAfterExhale)
breathingPatternSchema.virtual("totalCycleDuration").get(function () {
	const pattern = this.calculatedPattern;
	return pattern.inhale + pattern.hold + pattern.exhale + pattern.holdAfterExhale;
});

// METHODS

// METHOD: Get ratio as string (e.g., "1:2:2:0")
breathingPatternSchema.methods.getRatioString = function () {
	const { inhale, hold, exhale, holdAfterExhale } = this.patternRatio;
	return `${inhale}:${hold}:${exhale}:${holdAfterExhale}`;
};

// METHOD: Estimate practice duration based on number of cycles and total cycle duration
breathingPatternSchema.methods.estimatePracticeDuration = function (cycles) {
	const cycleDuration = this.totalCycleDuration;
	return Math.round((cycleDuration * cycles) / 60); // return duration in minutes
};

// METHOD: Check if pattern is safe for a given user level based on difficulty comparison
breathingPatternSchema.methods.isSafeForLevel = function (userLevel) {
	const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
	const patternLevel = levelOrder[this.difficulty];
	const currentLevel = levelOrder[userLevel];
	return currentLevel >= patternLevel;
};

// INDEXES
breathingPatternSchema.index({ difficulty: 1, energyEffect: 1 });
breathingPatternSchema.index({
	energyEffect: 1,
	bestTimeOfDay: 1,
	difficulty: 1,
}); // Used by getRecommendedBreathingPattern
breathingPatternSchema.index({ tags: 1 });
breathingPatternSchema.index({ "vkContext.practicePhase": 1 });
breathingPatternSchema.index({ "vkContext.recommendedBefore": 1 });
breathingPatternSchema.index({ isSystemPattern: 1 });
breathingPatternSchema.index({ bestTimeOfDay: 1 });

// Text index for full-text search across name fields, description and tags
breathingPatternSchema.index({
	romanizationName: "text",
	iastName: "text",
	sanskritName: "text",
	description: "text",
	tags: "text",
});

// VALIDATION

// VALIDATION: Ensure that ratio-based patterns have at least inhale or exhale > 0
breathingPatternSchema.pre("validate", async function () {
	if (this.patternType === "ratio_based") {
		const { inhale, exhale } = this.patternRatio;

		if (inhale === 0 && exhale === 0) {
			throw new Error("Breathing pattern must have at least inhale or exhale > 0");
		}
	}
});

// VALIDATION: Ensure that recommended practice durations and cycles are logically consistent
breathingPatternSchema.pre("validate", async function () {
	const { durationMinutes, cycles } = this.recommendedPractice;

	// Min cannot be greater than max
	if (durationMinutes.min > durationMinutes.max) {
		throw new Error("Duration min cannot be greater than max");
	}

	if (cycles.min > cycles.max) {
		throw new Error("Cycles min cannot be greater than max");
	}

	// Default must be between min and max
	if (
		durationMinutes.default < durationMinutes.min ||
		durationMinutes.default > durationMinutes.max
	) {
		throw new Error("Duration default must be between min and max");
	}

	if (cycles.default < cycles.min || cycles.default > cycles.max) {
		throw new Error("Cycles default must be between min and max");
	}
});

const BreathingPattern = mongoose.model("BreathingPattern", breathingPatternSchema);

module.exports = BreathingPattern;
