const mongoose = require("mongoose");

const journalEntrySchema = new mongoose.Schema(
	{
		// RELATIONSHIPS
		session: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Session",
			required: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		// MOOD BEFORE AND AFTER
		moodBefore: [
			{
				type: String,
				enum: [
					"calm",
					"anxious",
					"energized",
					"tired",
					"focused",
					"stressed",
					"happy",
					"sad",
					"grounded",
					"restless",
					"peaceful",
					"overwhelmed",
					"motivated",
					"discouraged",
				],
				required: true,
			},
		],
		moodAfter: [
			{
				type: String,
				enum: [
					"calm",
					"anxious",
					"energized",
					"tired",
					"focused",
					"stressed",
					"happy",
					"sad",
					"grounded",
					"restless",
					"peaceful",
					"overwhelmed",
					"motivated",
					"discouraged",
					"renewed",
					"centered",
					"light",
					"clear",
				],
			},
		],
		// LEVELS BEFORE AND AFTER
		energyLevel: {
			before: {
				type: Number,
				min: 1,
				max: 10,
			},
			after: {
				type: Number,
				min: 1,
				max: 10,
			},
		},
		stressLevel: {
			before: {
				type: Number,
				min: 1,
				max: 10,
			},
			after: {
				type: Number,
				min: 1,
				max: 10,
			},
		},
		// PHYSICAL REFLECTION
		physicalSensations: {
			type: String,
			trim: true,
			maxlength: 2000,
		},
		bodyAreas: [
			{
				area: {
					type: String,
					enum: [
						"neck",
						"shoulders",
						"back",
						"hips",
						"knees",
						"ankles",
						"wrists",
						"chest",
						"abdomen",
					],
				},
				sensation: {
					type: String,
					enum: [
						"tension",
						"relief",
						"pain",
						"openness",
						"strength",
						"flexibility",
						"neutral",
					],
				},
			},
		],
		// EMOTIONAL REFLECTION
		emotionalNotes: {
			type: String,
			trim: true,
			maxlength: 2000,
		},
		insights: {
			type: String,
			trim: true,
			maxlength: 2000,
		},
		// GRATITUDE SECTION
		gratitude: {
			type: String,
			trim: true,
			maxlength: 1000,
		},
		// FAVORITE AND CHALLENGING POSES
		favoritePoses: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Pose",
			},
		],
		challengingPoses: [
			{
				pose: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Pose",
				},
				reason: {
					type: String,
					trim: true,
				},
			},
		],
		// FEEDBACK ON SESSION
		difficultyFeedback: {
			type: String,
			enum: ["too_easy", "just_right", "too_hard"],
		},
		pacingFeedback: {
			type: String,
			enum: ["too_slow", "perfect", "too_fast"],
		},
		// MULTIMEDIA ATTACHMENTS
		photos: [
			{
				url: {
					type: String,
					trim: true,
					match: /^https?:\/\/.+/,
					required: true,
				},
				caption: {
					type: String,
					trim: true,
				},
			},
		],
		voiceNotes: [
			{
				url: {
					type: String,
					trim: true,
					match: /^https?:\/\/.+/,
					required: true,
				},
				duration: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],
		// NEXT SESSION GOALS
		nextSessionGoals: [
			{
				type: String,
				trim: true,
			},
		],
		// METADATA
		entryDate: {
			type: Date,
			default: Date.now,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

// INDEX
journalEntrySchema.index({ user: 1, entryDate: -1 });
journalEntrySchema.index({ session: 1 });
journalEntrySchema.index({ moodAfter: 1 });
journalEntrySchema.index({ entryDate: -1 });

const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);

module.exports = JournalEntry;
