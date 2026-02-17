const mongoose = require("mongoose");

const sequenceSchema = new mongoose.Schema(
	{
		// IDENTIFICATION
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		// CLASIFICATION
		difficulty: {
			type: String,
			enum: ["beginner", "intermediate", "advanced", "all_levels"],
			required: true,
		},
		style: {
			type: String,
			enum: [
				"vinyasa",
				"hatha",
				"yin",
				"restorative",
				"power",
				"gentle",
				"mixed",
			],
			default: "mixed",
		},
		// ESTIMATED DURATION
		estimatedDuration: {
			type: Number, // minutes
			required: true,
		},
		// SEQUENCE CONTENT
		blocks: [
			{
				type: {
					type: String,
					enum: ["pranayama", "poses", "meditation", "rest"],
					required: true,
				},
				order: {
					type: Number,
					required: true,
				},
				// ASANA BLOCK
				poses: [
					{
						pose: {
							type: mongoose.Schema.Types.ObjectId,
							ref: "Pose",
							required: true,
						},
						order: {
							type: Number,
							required: true,
						},
						duration: {
							type: Number, // seconds
							required: true,
						},
						side: {
							type: String,
							enum: ["left", "right", "both", "none"],
							default: "none",
						},
						repetitions: {
							type: Number,
							default: 1,
						},
						transition: {
							type: String,
							trim: true,
						},
						notes: {
							type: String,
							trim: true,
						},
					},
				],
				// PRANAYAMA BLOCK
				breathingPattern: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "BreathingPattern",
				},
				breathingDuration: Number, // minutes
				// MEDITATION BLOCK
				meditationType: {
					type: String,
					enum: ["silent", "body_scan", "breath_awareness", "guided"],
				},
				meditationDuration: Number, // minutes
				// REST BLOCK
				restDuration: Number, // minutes
			},
		],

		// CHARACTERISTICS
		theme: {
			type: String,
			trim: true, // ej: "apertura de cadera", "energía matutina"
		},
		focusAreas: [
			{
				type: String,
				enum: [
					"hips",
					"shoulders",
					"back",
					"core",
					"legs",
					"arms",
					"full_body",
					"balance",
					"flexibility",
					"strength",
				],
			},
		],
		mood: {
			type: String,
			enum: ["calming", "energizing", "balancing", "grounding", "uplifting"],
			required: true,
		},
		energyLevel: {
			type: String,
			enum: ["low", "moderate", "high"],
			default: "moderate",
		},
		// CONTEXT OF PRACTICE
		bestTimeOfDay: [
			{
				type: String,
				enum: ["morning", "midday", "afternoon", "evening", "night", "anytime"],
			},
		],
		goals: [
			{
				type: String,
				trim: true, // ej: "reducir estrés", "aumentar flexibilidad"
			},
		],
		// MULTIMEDIA
		coverImage: {
			type: String,
			default: null,
		},
		// ===== CREADOR Y VISIBILIDAD =====
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},

		isSystemTemplate: {
			type: Boolean,
			default: false,
		},

		isPublic: {
			type: Boolean,
			default: true,
		},
		// METADATA
		tags: [
			{
				type: String,
				trim: true,
			},
		],
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

// INDEX
sequenceSchema.index({ level: 1, estimatedDuration: 1 });
sequenceSchema.index({ mood: 1, energyLevel: 1 });
sequenceSchema.index({ createdBy: 1 });
sequenceSchema.index({ tags: 1 });
sequenceSchema.index({ title: "text", description: "text" });

// ===== VIRTUAL: Duración total calculada =====
sequenceSchema.virtual("calculatedDuration").get(function () {
	let total = 0;
	this.blocks.forEach((block) => {
		if (block.type === "poses") {
			total += block.poses.reduce((sum, pose) => sum + pose.duration, 0);
		} else if (block.type === "pranayama") {
			total += (block.breathingDuration || 0) * 60;
		} else if (block.type === "meditation") {
			total += (block.meditationDuration || 0) * 60;
		} else if (block.type === "rest") {
			total += (block.restDuration || 0) * 60;
		}
	});
	return Math.round(total / 60); // convertir a minutos
});

const Sequence = mongoose.model("Sequence", sequenceSchema);

module.exports = Sequence;
