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
 * - Flexible ratios: can be 1:2:2:1 (Ujjayi), 2:2:2:2 (Viloma), etc.
 * - Complete VK integration: practice phases, recommended families, prerequisites
 * - Virtual fields for automatic calculations (eg: calculatedPattern)
 * - Useful methods: getRatioString() for conversion
 *
 * Relationships:
 * - Referenced by: Session.completePractice.pranayama
 * - Referenced by: User.preferences.pranayamaPreference
 * - Self-reference: prerequisiteBreathing (technique progression)
 *
 * @example
 * // Create Ujjayi technique (Ocean Breath)
 * const ujjayi = new BreathingPattern({
 *   romanizationName: "Ujjayi",
 *   sanskritName: "उज्जयी",
 *   difficulty: "beginner",
 *   patternType: "ratio_based",
 *   patternRatio: { inhale: 1, hold: 0, exhale: 1, holdAfterExhale: 0 },
 *   vkTechniques: { ujjayi: { enabled: true, withSound: true } },
 *   energyEffect: "calming"
 * });
 *
 * @example
 * // Get ratio as string
 * const ratioStr = breathingPattern.getRatioString(); // "1:0:1:0"
 * // Calculate actual breath times
 * const times = breathingPattern.calculatedPattern; // { inhale: 5, hold: 0, exhale: 5, holdAfterExhale: 0 }
 */
const mongoose = require("mongoose");

const breathingPatternSchema = new mongoose.Schema(
	{
		// IDENTIFICATION
		romanizationName: { type: String, required: true, trim: true },
		iastName: { type: String, required: true, trim: true },
		sanskritName: { type: String, required: true, trim: true },
		alias: [{ type: String, trim: true }],
		description: {
			type: String,
			required: true,
			trim: true,
		},

		// CLASSIFICATION
		difficulty: {
			type: String,
			enum: ["beginner", "intermediate", "advanced"],
			default: "beginner",
			required: true,
		},

		// BREATHING PATTERN - Improved with ratios
		patternType: {
			type: String,
			enum: ["ratio_based", "time_based", "count_based"],
			default: "ratio_based",
		},

		// For patterns based on ratio (preferred in VK)
		patternRatio: {
			inhale: { type: Number, default: 1, min: 0 },
			hold: { type: Number, default: 0, min: 0 },
			exhale: { type: Number, default: 1, min: 0 },
			holdAfterExhale: { type: Number, default: 0, min: 0 },
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
			inhale: { type: Number, default: 5, min: 0 },
			hold: { type: Number, default: 0, min: 0 },
			exhale: { type: Number, default: 5, min: 0 },
			holdAfterExhale: { type: Number, default: 0, min: 0 },
		},

		// RECOMMENDED PRACTICE - Improved
		recommendedPractice: {
			measureBy: {
				type: String,
				enum: ["time", "cycles", "either"],
				default: "cycles",
			},
			durationMinutes: {
				min: { type: Number, default: 3, min: 1 },
				max: { type: Number, default: 10, min: 1 },
				default: { type: Number, default: 5 },
			},
			cycles: {
				min: { type: Number, default: 5, min: 1 },
				max: { type: Number, default: 20, min: 1 },
				default: { type: Number, default: 10 },
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
				nostrilSequence: [String], // ['left', 'right', 'both']
			},

			// Kapalabhati (Skull Shining Breath)
			kapalabhati: {
				enabled: { type: Boolean, default: false },
				pumpingRate: { type: Number, min: 30, max: 120 }, // per minute
				rounds: { type: Number, default: 3 },
			},

			// Bhastrika (Bellows Breath)
			bhastrika: {
				enabled: { type: Boolean, default: false },
				intensity: {
					type: String,
					enum: ["gentle", "moderate", "vigorous"],
				},
				rounds: { type: Number, default: 3 },
			},

			// Ujjayi (Ocean Breath)
			ujjayi: {
				enabled: { type: Boolean, default: false },
				withSound: { type: Boolean, default: true },
			},

			// Bhramari (Bee Breath)
			bhramari: {
				enabled: { type: Boolean, default: false },
				pitch: { type: String, enum: ["low", "medium", "high"] },
			},

			// Sitali / Sitkari (Cooling Breaths)
			cooling: {
				enabled: { type: Boolean, default: false },
				type: { type: String, enum: ["sitali", "sitkari"] },
			},

			// Bandhas (Energy Locks) - CRUCIAL in VK
			bandhas: {
				mula: { type: Boolean, default: false }, // Root lock
				uddiyana: { type: Boolean, default: false }, // Abdominal lock
				jalandhara: { type: Boolean, default: false }, // Throat lock
				whenToApply: {
					type: String,
					enum: ["on_hold", "throughout", "on_exhale", "none"],
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
		contraindications: [{ type: String, trim: true }],
		warnings: { type: String, trim: true },

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
	},
);

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

// METHOD: Get ratio as string (e.g., "1:2:2:0")
breathingPatternSchema.methods.getRatioString = function () {
	const { inhale, hold, exhale, holdAfterExhale } = this.patternRatio;
	return `${inhale}:${hold}:${exhale}:${holdAfterExhale}`;
};

// INDEX
breathingPatternSchema.index({ romanizationName: 1 });
breathingPatternSchema.index({ difficulty: 1, energyEffect: 1 });
breathingPatternSchema.index({ tags: 1 });
breathingPatternSchema.index({ "vkContext.practicePhase": 1 });
breathingPatternSchema.index({ "vkContext.recommendedBefore": 1 });

const BreathingPattern = mongoose.model("BreathingPattern", breathingPatternSchema);

module.exports = BreathingPattern;
