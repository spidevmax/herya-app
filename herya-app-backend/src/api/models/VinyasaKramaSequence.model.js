/**
 * @schema VinyasaKramaSequence
 * @description Model for VK (Vinyasa Krama) sequences - the heart of the app
 *
 * Manages:
 * - VK Families: 14 different families (Tadasana, Standing Asymmetric, Seated, etc.)
 * - Progression Levels: 1 (beginner) → 2 (intermediate) → 3 (advanced)
 * - Complete structure: entry vinyasa, core poses, exit vinyasa
 * - Pedagogical information: benefits, contraindications, therapeutic focus
 * - Progression: prerequisites and next steps
 * - Estimated duration: min, max, recommended
 * - Integrated pranayama and meditation
 * - Teaching instructions: setup, step-by-step, common mistakes, tips
 *
 * Key Features:
 * - Full VK structure: each pose has timing, counterpose, vinyasa, contextual instructions
 * - Level variations: adjust poses based on user progress
 * - Detailed structure: entry (how to enter) → core poses → exit (how to exit)
 * - Therapeutic focus: primary benefit, target conditions, anatomy
 * - Integrated pranayama and meditation recommendations
 * - Methods: getEstimatedDuration(), canProgressTo(), getNextSequence()
 * - Indexes: searches by family, level, duration, therapeutic focus
 *
 * Relationships:
 * - One-to-Many: Poses (via structure.corePoses)
 * - Self-reference: prerequisites, nextSteps (sequence progression)
 * - Referenced by: Session.vkSequence, Session.completePractice
 * - Referenced by: User.vkProgression (history of completed)
 *
 * @example
 * // Create Tadasana Level 1 sequence (beginner)
 * const tadasanaL1 = new VKSequence({
 *   family: "tadasana",
 *   level: 1,
 *   sanskritName: "ताडासन परिवार स्तर १",
 *   englishName: "Tadasana Family - Level 1",
 *   description: "Mountain pose variations for foundation and foot awareness",
 *   structure: {
 *     entry: {
 *       fromPose: null, // Starts from Tadasana
 *       steps: [
 *         {
 *           instruction: "Stand in Tadasana",
 *           pose: tadasanaId,
 *           breaths: 5
 *         }
 *       ]
 *     },
 *     corePoses: [
 *       {
 *         pose: tadasanaId,
 *         order: 1,
 *         breaths: 10,
 *         vinyasaTransition: "direct"
 *       },
 *       {
 *         pose: uttanasanaId,
 *         order: 2,
 *         breaths: 8,
 *         counterpose: { pose: utkatasanaId, breaths: 5 }
 *       }
 *     ]
 *   },
 *   therapeuticFocus: {
 *     primaryBenefit: "Foundation awareness and foot grounding",
 *     anatomicalFocus: [
 *       { area: "feet", action: "strength" },
 *       { area: "spine", action: "extension" }
 *     ]
 *   },
 *   estimatedDuration: { min: 20, max: 35, recommended: 25 }
 * });
 * await tadasanaL1.save();
 */
const mongoose = require("mongoose");

const vkSequenceSchema = new mongoose.Schema(
	{
		// VK IDENTIFICATION
		family: {
			type: String,
			enum: [
				"tadasana", // Variaciones de montaña
				"standing_asymmetric", // Asymmetric standing poses
				"standing_symmetric", // Symmetric standing poses
				"one_leg_standing", // Equilibrios en una pierna
				"seated", // Posturas sentadas
				"supine", // Lying on back
				"prone", // Lying on stomach
				"inverted", // Inversiones
				"meditative", // Posturas meditativas
				"bow_sequence", // Secuencia de arco
				"triangle_sequence", // Triangle sequence
				// FAMILIAS ADICIONALES
				"sun_salutation", // Surya Namaskar (fundamental en VK)
				"vajrasana_variations", // Posturas sobre rodillas
				"lotus_variations", // Variaciones de Padmasana
			],
			required: true,
		},

		level: {
			type: Number,
			enum: [1, 2, 3],
			required: true,
		},

		sanskritName: { type: String, required: true, trim: true },
		englishName: { type: String, required: true, trim: true },
		description: { type: String, trim: true },

		// ESTRUCTURA VK
		structure: {
			// Vinyasa de entrada (desde postura previa)
			entry: {
				fromPose: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Pose",
					default: null, // null = empieza desde Tadasana/Savasana
				},
				steps: [
					{
						instruction: { type: String, trim: true },
						pose: { type: mongoose.Schema.Types.ObjectId, ref: "Pose" },
						breaths: { type: Number, default: 1, min: 1 },
					},
				],
			},

			// Progression of poses in the sequence
			corePoses: [
				{
					pose: {
						type: mongoose.Schema.Types.ObjectId,
						ref: "Pose",
						required: true,
					},
					order: { type: Number, required: true, min: 1 },

					// VK-specific information
					breaths: {
						type: Number,
						default: 5,
						min: 3,
						max: 12,
					},

					// Contrapostura (opcional)
					counterpose: {
						pose: { type: mongoose.Schema.Types.ObjectId, ref: "Pose" },
						breaths: { type: Number, default: 3, min: 1 },
					},

					// Vinyasa entre poses
					vinyasaTransition: {
						type: String,
						enum: ["full", "half", "direct", "custom"],
						default: "half",
					},

					customTransition: [
						{
							instruction: { type: String, trim: true },
							pose: { type: mongoose.Schema.Types.ObjectId, ref: "Pose" },
							breaths: { type: Number, default: 1 },
						},
					],

					// Contextual cues specific to this pose
					contextualCues: [{ type: String, trim: true }],

					// Variaciones para distintos niveles
					variations: [
						{
							name: { type: String, trim: true },
							pose: { type: mongoose.Schema.Types.ObjectId, ref: "Pose" },
							whenToUse: { type: String, trim: true },
						},
					],
				},
			],

			// Vinyasa de salida
			exit: {
				toPose: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Pose",
				},
				steps: [
					{
						instruction: { type: String, trim: true },
						pose: { type: mongoose.Schema.Types.ObjectId, ref: "Pose" },
						breaths: { type: Number, default: 1, min: 1 },
					},
				],
			},
		},

		// THERAPEUTIC ASPECTS (crucial for VK)
		therapeuticFocus: {
			primaryBenefit: {
				type: String,
				required: true,
				trim: true,
			},

			targetConditions: [{ type: String, trim: true }],

			anatomicalFocus: [
				{
					area: {
						type: String,
						enum: [
							"spine",
							"hips",
							"shoulders",
							"knees",
							"ankles",
							"wrists",
							"core",
							"neck",
						],
						required: true,
					},
					action: {
						type: String,
						enum: [
							"flexion",
							"extension",
							"rotation",
							"lateral_flexion",
							"strength",
							"mobility",
						],
						required: true,
					},
				},
			],

			contraindications: [{ type: String, trim: true }],
			precautions: [{ type: String, trim: true }],
		},

		// PEDAGOGICAL PROGRESSION
		prerequisites: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "VKSequence",
			},
		],

		nextSteps: [
			{
				sequence: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "VKSequence",
				},
				description: { type: String, trim: true },
			},
		],

		// PRACTICE
		estimatedDuration: {
			min: { type: Number, min: 5 },
			max: { type: Number, min: 5 },
			recommended: { type: Number, min: 5 },
		},

		repetitions: {
			type: Number,
			default: 1,
			min: 1,
			max: 3,
		},

		// PRANAYAMA INTEGRATION
		recommendedPranayama: [
			{
				timing: {
					type: String,
					enum: ["before", "after", "during"],
					default: "before",
				},
				pattern: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "BreathingPattern",
				},
				duration: { type: Number, min: 1 }, // minutos
			},
		],

		// VK PHILOSOPHY
		philosophicalContext: { type: String, trim: true },
		teachingNotes: { type: String, trim: true },

		// METADATA
		tags: [{ type: String, trim: true }],
		difficulty: {
			type: String,
			enum: ["beginner", "intermediate", "advanced"],
			required: true,
		},

		isSystemSequence: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

// VALIDATION: corePoses orders must be consecutive
vkSequenceSchema.pre("save", function (next) {
	if (this.structure && this.structure.corePoses) {
		const poses = this.structure.corePoses;

		if (poses.length === 0) {
			return next();
		}

		// Extraer y ordenar los orders
		const orders = poses.map((p) => p.order).sort((a, b) => a - b);

		// Verificar que empiecen en 1 y sean consecutivos
		const expectedOrders = Array.from(
			{ length: orders.length },
			(_, i) => i + 1,
		);

		const isValid = orders.every((order, idx) => order === expectedOrders[idx]);

		if (!isValid) {
			return next(
				new Error(
					"corePoses orders must be consecutive starting from 1 (e.g., 1, 2, 3, 4...)",
				),
			);
		}

		// Check for duplicates (although previous check should cover it)
		const uniqueOrders = new Set(orders);
		if (uniqueOrders.size !== orders.length) {
			return next(new Error("corePoses orders must be unique"));
		}
	}
	next();
});

// VALIDACIÓN: estimatedDuration.max debe ser >= min
vkSequenceSchema.pre("save", function (next) {
	if (this.estimatedDuration) {
		const { min, max } = this.estimatedDuration;
		if (min && max && max < min) {
			return next(
				new Error("estimatedDuration.max must be greater than or equal to min"),
			);
		}
	}
	next();
});

// ÍNDICES
vkSequenceSchema.index({ family: 1, level: 1 });
vkSequenceSchema.index({ difficulty: 1 });
vkSequenceSchema.index({ "therapeuticFocus.targetConditions": 1 });
vkSequenceSchema.index({ "therapeuticFocus.anatomicalFocus.area": 1 });

// ÍNDICES ADICIONALES para búsquedas de prerrequisitos
vkSequenceSchema.index({ prerequisites: 1 });
vkSequenceSchema.index({ "nextSteps.sequence": 1 });
vkSequenceSchema.index({ tags: 1 });
vkSequenceSchema.index({ isSystemSequence: 1 });

// ÍNDICE DE TEXTO para búsquedas
vkSequenceSchema.index({
	sanskritName: "text",
	englishName: "text",
	description: "text",
	tags: "text",
});

const VinyasaKramaSequence = mongoose.model("VKSequence", vkSequenceSchema);

module.exports = VinyasaKramaSequence;
