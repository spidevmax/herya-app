/**
 * @schema Pose
 * @description Model for Asanas (yoga poses) within Vinyasa Krama
 *
 * Manages all information about yoga poses including:
 * - Identification (name in Sanskrit, romanized, IAST)
 * - VK-specific classification (primary category, functional secondaries)
 * - VK context (which families it appears in, role in sequence, vinyasa count)
 * - Sidedness: symmetric vs asymmetric poses (L/R/both)
 * - Technical information (recommended breaths, modifications, contraindications)
 * - Teaching: step-by-step instructions, common mistakes, safety tips
 * - Experience: sensations, visualization, chakra balance
 * - Relationships between poses: counterpose, preparatory, transition
 *
 * Key Features:
 * - VK-optimized: each pose knows which family it belongs to, its role, how many breaths
 * - Clear sidedness for asymmetric poses: L-R-L-R vs L-L-L-R-R-R
 * - Modifications by level: variations for each difficulty
 * - Fully documented for step-by-step tracking
 * - Indexes for efficient searches by family, difficulty, category
 *
 * Relationships:
 * - Referenced by: VinyasaKramaSequence.structure.corePoses
 * - Referenced by: Session.actualPractice.posesModified
 * - Self-reference: modifications (variations of the same pose)
 * - Self-reference: counterpose, preparatory, transition
 *
 * @example
 * // Create Tadasana (Mountain Pose)
 * const tadasana = new Pose({
 *   name: "Mountain Pose",
 *   sanskritName: "ताडासन",
 *   romanizationName: "Tadasana",
 *   difficulty: "beginner",
 *   vkCategory: { primary: "standing_mountain" },
 *   sidedness: { type: "symmetric" },
 *   recommendedBreaths: { min: 5, max: 8 },
 *   vkContext: {
 *     appearsInFamilies: ["tadasana"],
 *     roleInSequence: "primary"
 *   }
 * });
 * await tadasana.save();
 */
const mongoose = require("mongoose");

const poseSchema = new mongoose.Schema(
	{
		// IDENTIFICATION
		name: { type: String, required: true, trim: true },
		romanizationName: { type: String, required: true, trim: true },
		iastName: { type: String, required: true, trim: true },
		sanskritName: { type: String, required: true, trim: true },
		alias: [{ type: String, trim: true }],

		// VK-SPECIFIC CLASSIFICATION
		vkCategory: {
			primary: {
				type: String,
				enum: [
					"standing_mountain", // Tadasana variations
					"standing_asymmetric", // Warrior, Triangle, etc
					"standing_symmetric", // Prasarita, Wide legs
					"one_leg_balance", // Tree, Eagle, etc
					"seated_forward", // Paschimottanasana, etc
					"seated_twist", // Ardha Matsyendrasana
					"seated_hip_opener", // Baddha Konasana
					"supine", // Lying on back
					"prone", // Lying on stomach
					"inverted", // Shoulderstand, Headstand
					"arm_support", // Crow, Handstand
					"backbend", // Dhanurasana, Urdhva Dhanurasana
					"meditative", // Padmasana, Siddhasana
				],
				required: true,
			},

			// Multiple secondary categories (functional classification)
			secondary: [
				{
					type: String,
					enum: [
						"forward_bend",
						"backbend",
						"twisting",
						"hip_opening",
						"core_strength",
						"shoulder_opening",
						"balancing",
						"restorative",
					],
				},
			],
		},

		// General classification (kept for compatibility)
		category: [
			{
				type: String,
				enum: [
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
				],
			},
		],

		difficulty: {
			type: String,
			enum: ["beginner", "intermediate", "advanced"],
			default: "beginner",
			required: true,
		},

		// VK CONTEXT
		vkContext: {
			// Which VK families include this pose
			appearsInFamilies: [
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

			// Role in sequence
			roleInSequence: {
				type: String,
				enum: ["primary", "counterpose", "transition", "preparation"],
				default: "primary",
			},

			// Vinyasa count (for traditional counting)
			vinyasaCount: { type: Number, min: 0 },

			// Is this pose typically part of a vinyasa transition itself?
			isVinyasaPose: { type: Boolean, default: false },
		},

		// SIDEDNESS - More clear than "bilateral"
		sidedness: {
			type: {
				type: String,
				enum: ["symmetric", "left_only", "right_only", "both_sides"],
				default: "symmetric",
			},

			// For asymmetric poses
			breathsPerSide: {
				type: Number,
				default: 5,
				min: 3,
				max: 12,
			},

			// Should you do both sides in sequence or alternate?
			sequencing: {
				type: String,
				enum: ["consecutive", "alternating"], // e.g., L-R-L-R or L-L-L-R-R-R
				default: "consecutive",
			},
		},

		transitionType: {
			type: String,
			enum: ["static", "dynamic", "flow"],
			default: "static",
		},

		// RECOMMENDED HOLD - By breaths (VK standard)
		recommendedBreaths: {
			beginner: {
				min: { type: Number, default: 3 },
				max: { type: Number, default: 5 },
			},
			intermediate: {
				min: { type: Number, default: 5 },
				max: { type: Number, default: 8 },
			},
			advanced: {
				min: { type: Number, default: 8 },
				max: { type: Number, default: 12 },
			},
		},

		// Optional: Time-based hold for dynamic flows
		recommendedHoldSeconds: {
			type: Number,
			default: 30,
			min: 10,
			max: 300,
		},

		// DRISHTI (Gaze point) - Critical in VK
		drishti: {
			type: String,
			enum: [
				"nasagrai", // Tip of nose
				"brumadhya", // Third eye / between eyebrows
				"nabi_chakra", // Navel
				"hastagrai", // Hand
				"padayoragrai", // Toes
				"parshva_drishti", // Far to the side
				"angushta_madhyai", // Thumb
				"urdhva_drishti", // Up to sky
				"none",
			],
			default: "none",
		},

		// ALIGNMENT DETAILS - VK-specific
		alignmentDetails: {
			// Key alignment points
			keyPoints: [
				{
					area: {
						type: String,
						enum: [
							"feet",
							"knees",
							"hips",
							"pelvis",
							"spine",
							"shoulders",
							"arms",
							"hands",
							"neck",
							"head",
						],
					},
					instruction: { type: String, trim: true },
					commonMistake: { type: String, trim: true },
				},
			],

			// Bandhas to activate
			activeBandhas: [
				{
					type: String,
					enum: ["mula", "uddiyana", "jalandhara"],
				},
			],

			// Muscle engagement
			muscleEngagement: [
				{
					muscle: { type: String, trim: true },
					action: {
						type: String,
						enum: ["engage", "relax", "lengthen", "strengthen"],
					},
				},
			],

			// Foundation points (what touches the ground)
			foundationPoints: [{ type: String, trim: true }],
		},

		// EDUCATIONAL CONTENT
		instructions: {
			setup: [{ type: String, trim: true }],
			alignment: [{ type: String, trim: true }],
			modifications: [{ type: String, trim: true }],
			exit: [{ type: String, trim: true }],
		},

		benefits: [{ type: String, trim: true }],
		contraindications: [{ type: String, trim: true }],

		breathingCue: {
			type: String,
			trim: true,
			default: "Breathe steadily and deeply",
		},

		commonMistakes: [{ type: String, trim: true }],

		// ANATOMICAL FOCUS
		targetMuscles: [{ type: String, trim: true }],
		jointFocus: [{ type: String, trim: true }],

		// PROPS USAGE
		props: [{ type: String, trim: true }],

		// MULTIMEDIA
		media: {
			thumbnail: { type: String, trim: true },
			images: [{ type: String, trim: true }],
			videos: [{ type: String, trim: true }],
		},

		// ADDITIONAL INFO
		philosophicalAspect: { type: String, trim: true },

		chakraRelated: {
			type: String,
			enum: [
				"muladhara",
				"svadhisthana",
				"manipura",
				"anahata",
				"vishuddha",
				"ajna",
				"sahasrara",
			],
		},

		energyEffect: {
			type: String,
			enum: ["calming", "energizing", "balancing", "grounding"],
		},

		// RELATIONSHIPS WITH OTHER POSES
		preparatoryPoses: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Pose",
			},
		],

		followUpPoses: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Pose",
			},
		],

		// VK-SPECIFIC: Counter-poses
		recommendedCounterposes: [
			{
				pose: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Pose",
				},
				reason: { type: String, trim: true },
			},
		],

		// METADATA
		tags: [{ type: String, trim: true }],
		isSystemPose: { type: Boolean, default: true },
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

// METHOD: Get recommended breaths for user's level
poseSchema.methods.getBreathsForLevel = function (userLevel) {
	const level = userLevel || "beginner";
	return this.recommendedBreaths[level];
};

// METHOD: Check if pose is asymmetric
poseSchema.methods.isAsymmetric = function () {
	return (
		this.sidedness.type === "both_sides" ||
		this.sidedness.type === "left_only" ||
		this.sidedness.type === "right_only"
	);
};

// METHOD: Get total breaths needed (accounting for both sides)
poseSchema.methods.getTotalBreaths = function (level = "beginner") {
	const breaths = this.recommendedBreaths[level];
	const avgBreaths = (breaths.min + breaths.max) / 2;

	if (this.isAsymmetric() && this.sidedness.type === "both_sides") {
		return avgBreaths * 2; // Both sides
	}

	return avgBreaths;
};

// INDEX
poseSchema.index({
	name: "text",
	romanizationName: "text",
	iastName: "text",
	sanskritName: "text",
	alias: "text",
	tags: "text",
});

poseSchema.index({ category: 1 });
poseSchema.index({ difficulty: 1 });
poseSchema.index({ energyEffect: 1 });
poseSchema.index({ chakraRelated: 1 });
poseSchema.index({ isSystemPose: 1 });

// VK-specific indexes
poseSchema.index({ "vkCategory.primary": 1 });
poseSchema.index({ "vkCategory.secondary": 1 });
poseSchema.index({ "vkContext.appearsInFamilies": 1 });
poseSchema.index({ "vkContext.roleInSequence": 1 });
poseSchema.index({ "sidedness.type": 1 });

const Pose = mongoose.model("Pose", poseSchema);

module.exports = Pose;
