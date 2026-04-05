/**
 * @schema JournalEntry
 * @description Model for reflective journaling after each practice session (Digital Garden core)
 *
 * Manages:
 * - Personal post-session records (reflections, sensations, changes)
 * - Mood tracking: before and after (16 moods before / 20 moods after)
 * - Energy & Stress levels: 1-10 scale before/after
 * - Physical sensations: how the body feels after practice
 * - Emotional/mental insights: clarity, peace, rest, etc.
 * - Anatomical observations: specific body areas before/after with improvement tracking
 * - General notes: free-form reflections
 * - Gratitude and learnings: what the session left behind
 * - Multimedia: photos and voice notes (Cloudinary)
 * - VK progression feedback: ready for next level
 *
 * Key Features:
 * - Multi-mood before/after: select multiple emotional states
 * - 1-10 numeric scales for energy and stress (quantification)
 * - Detailed qualitative fields for deep reflection
 * - Anatomical tracking for therapeutic insights
 * - Unique relationship with Session: one journal per session (1:1)
 * - Virtuals: moodImprovement, energyChange, stressReduction, gardenColor
 * - Indexes for searches by user, date, mood, energy, sequence family
 *
 * Relationships:
 * - Belongs to: User (one-to-many)
 * - Belongs to: Session (one-to-one, unique constraint)
 * - References: Pose (for favorite/challenging)
 *
 * @example
 * // Create journal entry after session
 * const journal = new JournalEntry({
 *   session: sessionId,
 *   user: userId,
 *   moodBefore: ["stressed", "anxious"],
 *   moodAfter: ["calm", "peaceful", "renewed"],
 *   energyLevel: { before: 3, after: 7 },
 *   stressLevel: { before: 8, after: 3 },
 *   physicalSensations: "Deep stretch in the hips. Felt lighter afterwards.",
 *   emotionalNotes: "Practice helped clarify what worries me.",
 *   gratitude: "Grateful for this practice space.",
 *   vkReflection: {
 *     sequenceFamily: "seated",
 *     sequenceLevel: 1,
 *     anatomicalObservations: [{
 *       area: "hips",
 *       beforePractice: "Tight and restricted",
 *       afterPractice: "More open, less tension",
 *       improvement: "moderate"
 *     }],
 *     readyForNextLevel: false
 *   }
 * });
 * await journal.save();
 *
 * @example
 * // Calculate improvement
 * const moodChange = journal.moodImprovement; // Positive mood increase
 * const energyDelta = journal.energyChange;    // +4  (after 7 - before 3)
 * const stressDelta = journal.stressReduction;  // +5  (before 8 - after 3, positive = stress went down)
 */
const mongoose = require("mongoose");

const journalEntrySchema = new mongoose.Schema(
	{
		// RELATIONSHIPS
		session: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Session",
			required: true,
			unique: true, // One journal entry per session
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true, // Index for frequent user queries
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
					"scattered",
					"irritated",
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
					"scattered",
					"irritated",
				],
			},
		],
		signalAfter: {
			type: String,
			enum: ["green", "yellow", "red"],
		},

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
						"upper_back",
						"lower_back",
						"hips",
						"knees",
						"ankles",
						"wrists",
						"chest",
						"abdomen",
						"hamstrings",
						"quadriceps",
					],
					required: true,
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
						"soreness",
					],
					required: true,
				},
				notes: {
					type: String,
					trim: true,
					maxlength: 500,
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
					required: true,
				},
				notes: { type: String, trim: true, maxlength: 500 },
			},
		],
		challengingPoses: [
			{
				pose: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Pose",
					required: true,
				},
				reason: {
					type: String,
					trim: true,
					maxlength: 500,
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
				cloudinaryId: {
					type: String,
					trim: true,
					required: true,
				},
				caption: {
					type: String,
					trim: true,
					maxlength: 500,
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
				cloudinaryId: {
					type: String,
					trim: true,
					required: true,
				},
				duration: {
					type: Number,
					required: true,
					min: 0, // 0 = unknown duration (client did not report it)
					max: 1800, // maximum 30 minutes
				},
				title: {
					type: String,
					trim: true,
					maxlength: 200,
				},
			},
		],

		// VK REFLECTION (Digital Garden Core)
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
							"upper_back",
							"lower_back",
							"hips",
							"knees",
							"ankles",
							"wrists",
							"chest",
							"abdomen",
							"hamstrings",
							"quadriceps",
						],
						required: true,
					},
					beforePractice: {
						type: String,
						trim: true,
						maxlength: 500,
						required: true,
					},
					afterPractice: {
						type: String,
						trim: true,
						maxlength: 500,
						required: true,
					},
					improvement: {
						type: String,
						enum: ["significant", "moderate", "slight", "none", "regressed"],
						required: true,
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
				maxlength: 500,
			},
		],

		// TAGS
		tags: [
			{
				type: String,
				trim: true,
				lowercase: true,
			},
		],
	},
	{
		timestamps: true,
		versionKey: false,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// VIRTUALS

// moodImprovement: positive score = more positive moods + fewer negative moods after practice
journalEntrySchema.virtual("moodImprovement").get(function () {
	const positiveMoods = [
		"calm",
		"energized",
		"focused",
		"happy",
		"grounded",
		"peaceful",
		"motivated",
		"renewed",
		"centered",
		"light",
		"clear",
	];
	const negativeMoods = [
		"anxious",
		"tired",
		"stressed",
		"sad",
		"restless",
		"overwhelmed",
		"discouraged",
		"scattered",
		"irritated",
	];

	const beforePositive = this.moodBefore.filter((m) => positiveMoods.includes(m)).length;
	const beforeNegative = this.moodBefore.filter((m) => negativeMoods.includes(m)).length;
	const afterPositive = this.moodAfter.filter((m) => positiveMoods.includes(m)).length;
	const afterNegative = this.moodAfter.filter((m) => negativeMoods.includes(m)).length;

	// Positive: gained positive moods and/or shed negative ones
	return afterPositive - beforePositive + (beforeNegative - afterNegative);
});

// energyChange: positive = energy gained during practice
journalEntrySchema.virtual("energyChange").get(function () {
	return this.energyLevel.after - this.energyLevel.before;
});

// stressReduction: positive = stress decreased during practice
journalEntrySchema.virtual("stressReduction").get(function () {
	return this.stressLevel.before - this.stressLevel.after; // Positive = stress went down
});

// gardenColor: hex color based on mood improvement score, used by the Digital Garden visualization
journalEntrySchema.virtual("gardenColor").get(function () {
	const improvement = this.moodImprovement;
	if (improvement >= 3) return "#5DB075"; // Green  — strong improvement
	if (improvement >= 1) return "#FFB347"; // Orange — moderate improvement
	if (improvement === 0) return "#87CEEB"; // Blue   — neutral
	return "#FF6B6B"; // Coral  — regression (rare but possible)
});

// VALIDATION

// VALIDATION: At least one mood must be selected
journalEntrySchema
	.path("moodBefore")
	.validate(
		(value) => value && value.length > 0,
		"At least one mood before practice must be selected",
	);

journalEntrySchema
	.path("moodAfter")
	.validate(
		(value) => value && value.length > 0,
		"At least one mood after practice must be selected",
	);

// VALIDATION: Prevent duplicate mood selections
journalEntrySchema
	.path("moodBefore")
	.validate(
		(value) => new Set(value).size === value.length,
		"Cannot select the same mood multiple times in moodBefore",
	);

journalEntrySchema
	.path("moodAfter")
	.validate(
		(value) => new Set(value).size === value.length,
		"Cannot select the same mood multiple times in moodAfter",
	);

// VALIDATION: Maximum 5 moods per entry
journalEntrySchema
	.path("moodBefore")
	.validate((value) => value.length <= 5, "Cannot select more than 5 moods before practice");

journalEntrySchema
	.path("moodAfter")
	.validate((value) => value.length <= 5, "Cannot select more than 5 moods after practice");

// INDEXES
journalEntrySchema.index({ user: 1, createdAt: -1 }); // User's journals chronological
journalEntrySchema.index({ createdAt: -1 }); // All journals chronological
journalEntrySchema.index({ user: 1, "energyLevel.after": -1 }); // sortBy: "energy" in getJournalEntries
journalEntrySchema.index({ "vkReflection.sequenceFamily": 1 }); // By VK family
journalEntrySchema.index({ "vkReflection.sequenceLevel": 1 }); // By VK level
journalEntrySchema.index({ "vkReflection.readyForNextLevel": 1 }); // For progression tracking
journalEntrySchema.index({ tags: 1 }); // For tag-based searches
journalEntrySchema.index({ user: 1, "vkReflection.sequenceFamily": 1 }); // User journeys by VK family
journalEntrySchema.index(
	// Full-text search across journal content
	{
		insights: "text",
		emotionalNotes: "text",
		gratitude: "text",
		physicalSensations: "text",
	},
	{ name: "journal_text_search" },
);

const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);

module.exports = JournalEntry;
