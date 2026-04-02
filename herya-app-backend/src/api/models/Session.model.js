/**
 * @schema Session
 * @description Model for recording completed yoga practice sessions
 *
 * Manages:
 * - Individual VK, pranayama, or meditation sessions
 * - Complete sessions (warmup + main + cooldown + pranayama + meditation)
 * - Real modifications during practice (poses alternated, skipped, repetitions)
 * - Session duration and date
 * - VK-specific feedback (difficulty, pace, breathing comfort)
 *
 * Key Features:
 * - 4 session types: vk_sequence, pranayama, meditation, complete_practice
 * - Tracking of modifications: which poses changed, why, which variations used
 * - VK-specific feedback: challenge level, vinyasa pace, breath comfort
 * - Pre-save validation ensures coherence between sessionType and required fields
 * - Automatic timestamps for creation/update
 *
 * Relationships:
 * - Belongs to: User (one-to-many)
 * - References: VinyasaKramaSequence (optional, depending on sessionType)
 * - References: BreathingPattern (optional, in complete_practice)
 * - Referenced by: JournalEntry (one-to-one, session feedback)
 *
 * @example
 * // Create individual VK session
 * const session = new Session({
 *   user: userId,
 *   sessionType: "vk_sequence",
 *   vkSequence: sequenceId,
 *   duration: 45,
 *   completed: true,
 *   actualPractice: {
 *     repetitionsCompleted: 3,
 *     posesModified: [
 *       {
 *         originalPose: poseId1,
 *         usedVariation: variantId1,
 *         reason: "Shoulder tightness"
 *       }
 *     ]
 *   },
 *   vkFeedback: {
 *     sequenceChallenge: "appropriate",
 *     vinyasaPace: "perfect",
 *     breathComfort: "comfortable"
 *   }
 * });
 * await session.save();
 *
 * @example
 * // Create complete practice session
 * const completePractice = new Session({
 *   user: userId,
 *   sessionType: "complete_practice",
 *   duration: 60,
 *   completePractice: {
 *     warmup: warmupSequenceId,
 *     mainSequences: [sequenceId1, sequenceId2],
 *     cooldown: cooldownSequenceId,
 *     pranayama: breathingPatternId,
 *     meditation: { duration: 10, meditationType: "guided" }
 *   }
 * });
 */
const mongoose = require("mongoose");

const plannedBlockSchema = new mongoose.Schema(
	{
		blockType: {
			type: String,
			enum: ["vk_sequence", "pranayama", "meditation"],
			required: true,
		},
		label: { type: String, required: true },
		durationMinutes: { type: Number, required: true, min: 1 },
		order: { type: Number, required: true },
		// Optional references depending on blockType
		vkSequence: { type: mongoose.Schema.Types.ObjectId, ref: "VKSequence" },
		breathingPattern: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "BreathingPattern",
		},
		meditationType: { type: String },
		// Config data (pranayama pattern key, cycles, etc.)
		config: { type: mongoose.Schema.Types.Mixed },
	},
	{ _id: true, versionKey: false },
);

const sessionSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

		sessionType: {
			type: String,
			enum: ["vk_sequence", "pranayama", "meditation", "complete_practice"],
			required: true,
		},

		// Session lifecycle status
		status: {
			type: String,
			enum: ["planned", "active", "paused", "completed", "abandoned"],
			default: "planned",
		},

		// Planned blocks for guided practice
		plannedBlocks: [plannedBlockSchema],

		// Pre-practice check-in (optional)
		checkIn: {
			enabled: { type: Boolean, default: false },
			mood: [{ type: String }],
			energyLevel: { type: Number, min: 1, max: 10 },
			intention: { type: String, maxlength: 200 },
		},

		// Timer tracking for pause/resume accuracy
		timerData: {
			startedAt: Date,
			pausedAt: Date,
			totalPausedMs: { type: Number, default: 0 },
			currentBlockIndex: { type: Number, default: 0 },
			blockStartedAt: Date,
			blockPausedMs: { type: Number, default: 0 },
		},

		// For individual VK session
		vkSequence: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "VKSequence",
		},

		// User modifications during practice
		actualPractice: {
			repetitionsCompleted: Number,
			posesModified: [
				{
					originalPose: { type: mongoose.Schema.Types.ObjectId, ref: "Pose" },
					usedVariation: { type: mongoose.Schema.Types.ObjectId, ref: "Pose" },
					reason: String,
				},
			],
			skippedPoses: [
				{
					pose: { type: mongoose.Schema.Types.ObjectId, ref: "Pose" },
					reason: String,
				},
			],
		},

		// Complete practice (combining multiple sequences)
		completePractice: {
			warmup: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "VKSequence",
			},
			mainSequences: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: "VKSequence",
				},
			],
			cooldown: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "VKSequence",
			},
			pranayama: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "BreathingPattern",
			},
			meditation: {
				duration: Number,
				meditationType: String,
			},
		},

		duration: { type: Number, required: true, min: 1 },
		actualDuration: { type: Number }, // Real elapsed time (excluding pauses)
		completed: { type: Boolean, default: false },
		completionRate: { type: Number, min: 0, max: 100 }, // % of blocks completed
		date: { type: Date, default: Date.now },

		// VK-specific feedback
		vkFeedback: {
			sequenceChallenge: {
				type: String,
				enum: ["too_easy", "appropriate", "too_challenging"],
			},
			vinyasaPace: {
				type: String,
				enum: ["too_slow", "perfect", "too_fast"],
			},
			breathComfort: {
				type: String,
				enum: ["comfortable", "slightly_strained", "very_difficult"],
			},
		},

		notes: { type: String, trim: true, maxlength: 1000 },
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

// VALIDATION

// VALIDATION: Coherence between sessionType and required fields
// Uses async/throw pattern (Mongoose 9 compatible) to avoid "next is not a function" issues.
// completePractice is checked via mainSequences.length because Mongoose always initialises
// the subdocument as an empty object (truthy), even when the field was never set.
sessionSchema.pre("save", async function () {
	const { sessionType, vkSequence, completePractice, plannedBlocks } = this;

	// Block-based sessions carry references inside plannedBlocks — skip legacy checks
	const isBlockBased = Array.isArray(plannedBlocks) && plannedBlocks.length > 0;
	if (isBlockBased) return;

	// A completePractice subdocument is considered "set" only when it has real content
	const hasCompletePractice =
		completePractice?.mainSequences?.length > 0 ||
		completePractice?.warmup ||
		completePractice?.cooldown ||
		completePractice?.pranayama;

	// vk_sequence requires a vkSequence reference
	if (sessionType === "vk_sequence" && !vkSequence) {
		throw new Error("vk_sequence session type requires vkSequence field");
	}

	// complete_practice requires completePractice with at least one sequence
	if (sessionType === "complete_practice" && !hasCompletePractice) {
		throw new Error("complete_practice requires at least one sequence in mainSequences");
	}

	// vk_sequence must NOT include completePractice data
	if (sessionType === "vk_sequence" && hasCompletePractice) {
		throw new Error("vk_sequence cannot have completePractice field");
	}

	// complete_practice must NOT include a direct vkSequence reference
	if (sessionType === "complete_practice" && vkSequence) {
		throw new Error("complete_practice uses completePractice.mainSequences, not vkSequence");
	}
});

// INDEXES
sessionSchema.index({ user: 1, date: -1 });
sessionSchema.index({ user: 1, completed: 1, date: -1 }); // Used by getSessionStats (recent completed sessions per user)
sessionSchema.index({ user: 1, sessionType: 1 });
sessionSchema.index({ date: -1 });
sessionSchema.index({ sessionType: 1 });
sessionSchema.index({ completed: 1, date: -1 });
sessionSchema.index({ user: 1, status: 1 });

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
