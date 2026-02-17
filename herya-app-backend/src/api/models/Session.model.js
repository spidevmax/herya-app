const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		sessionType: {
			type: String,
			enum: ["asana", "pranayama", "meditation", "complete"],
			required: true,
		},
		// Para sesiones de ASANA
		sequence: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Sequence",
		},
		poses: [
			{
				pose: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Pose",
				},
				duration: { type: Number },
				order: { type: Number },
			},
		],
		// Para PRANAYAMA
		breathingPattern: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "BreathingPattern",
		},
		customPattern: {
			inhale: { type: Number },
			hold: { type: Number },
			exhale: { type: Number },
			holdAfterExhale: { type: Number },
		},
		cyclesCompleted: { type: Number },
		cyclesTarget: { type: Number },
		// Para MEDITACIÓN
		meditation: {
			duration: { type: Number, default: 0 },
			meditationType: {
				type: String,
				enum: [
					"focused_attention",
					"body_scan",
					"noting",
					"visualization",
					"loving_kindness",
					"skillful_compassion",
					"resting_awareness",
					"reflection",
					"zen_meditation",
					"mantra_meditation",
					"transcendental_meditation",
					"yoga_meditation",
					"vipassana_meditation",
					"chakra_meditation",
				],
			},
			notes: { type: String, trim: true },
		},
		// Datos comunes
		date: {
			type: Date,
			default: Date.now,
		},
		duration: {
			type: Number,
			required: true,
		},
		completed: {
			type: Boolean,
			default: false,
		},
		// Reflexión post-sesión
		moodBefore: { type: String, trim: true },
		moodAfter: { type: String, trim: true },
		energyLevelBefore: { type: Number, min: 1, max: 10 },
		energyLevelAfter: { type: Number, min: 1, max: 10 },
		physicalSensations: { type: String, trim: true },
		emotionalNotes: { type: String, trim: true },
		gratitude: { type: String, trim: true },
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

// INDEX
sessionSchema.index({ user: 1, date: -1 });
sessionSchema.index({ user: 1, completed: 1 });
sessionSchema.index({ user: 1, sessionType: 1 });
sessionSchema.index({ date: -1 });
sessionSchema.index({ sessionType: 1 });

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
