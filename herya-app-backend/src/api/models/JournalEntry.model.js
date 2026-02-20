/**
 * @schema JournalEntry
 * @description Model for reflective journaling after each practice session
 *
 * Manages:
 * - Personal post-session records (reflections, sensations, changes)
 * - Mood tracking: before and after (up to 17 selectable moods)
 * - Energy & Stress levels: 1-10 scale before/after
 * - Physical sensations: how the body feels after practice
 * - Emotional/mental sensations: clarity, peace, rest, etc.
 * - Spiritual experiences: insights, meditation, connectivity
 * - General notes: free-form reflections
 * - Perceived progress: improvements noticed in flexibility, strength, mindset
 * - Gratitude and learnings: what the session left behind
 *
 * Key Features:
 * - Multi-mood before/after: select multiple emotional states
 * - 1-10 numeric scales for energy and stress (quantification)
 * - Detailed qualitative fields for deep reflection
 * - Timestamps to see progression over time
 * - Unique relationship with Session: one journal per session
 * - Indexes for searches by user, date, mood, energy
 *
 * Relationships:
 * - Belongs to: User (one-to-many)
 * - Belongs to: Session (one-to-one, important session feedback)
 * - Can reference: other journal entries if there's thematic progression
 *
 * @example
 * // Create journal entry after session
 * const journal = new JournalEntry({
 *   session: sessionId,
 *   user: userId,
 *   moodBefore: ["stressed", "scattered", "anxious"],
 *   moodAfter: ["calm", "focused", "peaceful", "renewed"],
 *   energyLevel: { before: 3, after: 7 },
 *   stressLevel: { before: 8, after: 3 },
 *   physicalSensations: "Deep stretch in the hips. Felt lighter afterwards.",
 *   emotionalMentalInsights: "Practice helped clarify what worries me. Peaceful sensation.",
 *   spiritualExperiences: "Deep connection moment in Savasana. Very present.",
 *   progressNoted: "Better balance in one-leg poses. Less tremor.",
 *   gratitude: "Grateful for this practice space and self-care.",
 *   generalNotes: "Very satisfying session. Will return tomorrow."
 * });
 * await journal.save();
 */
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

		// MOOD BEFORE AND AFTER (como arrays)
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
				required: true,
			},
			after: {
				type: Number,
				min: 1,
				max: 10,
				required: true,
			},
		},
		stressLevel: {
			before: {
				type: Number,
				min: 1,
				max: 10,
				required: true,
			},
			after: {
				type: Number,
				min: 1,
				max: 10,
				required: true,
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
				pose: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Pose",
				},
				notes: { type: String, trim: true },
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
					min: 1,
					max: 1800, // maximum 30 minutes
				},
			},
		],

		// VK REFLECTION
		vkReflection: {
			sequenceFamily: {
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
			sequenceLevel: {
				type: Number,
				enum: [1, 2, 3],
			},

			progressionNotes: {
				type: String,
				trim: true,
				maxlength: 1000,
			},

			anatomicalObservations: [
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
					beforePractice: { type: String, trim: true, maxlength: 500 },
					afterPractice: { type: String, trim: true, maxlength: 500 },
					improvement: {
						type: String,
						enum: ["significant", "moderate", "slight", "none", "regressed"],
					},
				},
			],

			readyForNextLevel: {
				type: Boolean,
				default: false,
			},
		},

		// NEXT SESSION GOALS
		nextSessionGoals: [
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

// VALIDATION: At least one mood must be selected
journalEntrySchema.path("moodBefore").validate((value) => {
	return value && value.length > 0;
}, "At least one mood before practice must be selected");

journalEntrySchema.path("moodAfter").validate((value) => {
	return value && value.length > 0;
}, "At least one mood after practice must be selected");

// INDEX
journalEntrySchema.index({ user: 1, createdAt: -1 });
journalEntrySchema.index({ session: 1 });
journalEntrySchema.index({ createdAt: -1 });
journalEntrySchema.index({ "vkReflection.sequenceFamily": 1 });
journalEntrySchema.index({ "vkReflection.sequenceLevel": 1 });

const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);

module.exports = JournalEntry;
