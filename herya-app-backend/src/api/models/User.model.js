/**
 * @schema User
 * @description User model for the Herya application
 *
 * Manages:
 * - Authentication and user profile
 * - VK progression (unlocked families, completed sequences, current sequence)
 * - Practice preferences (intensity, duration, time, therapeutic focus)
 * - Progress tracking (total sessions, minutes, practice streak)
 * - Goals and personal user objectives
 * - Notifications and UI preferences
 *
 * Key Features:
 * - Automatic password hashing (bcrypt)
 * - Email validation: unique and correct format
 * - VK Progression tracking: unlock families → complete sequences → linear progress
 * - Utility methods: canAccessLevel(), markSequenceCompleted()
 * - Support for roles (user, admin) and multilingual preferences (en, es)
 * - Optimized indexes for frequent searches
 *
 * Relationships:
 * - One-to-Many: Sessions
 * - One-to-Many: JournalEntries
 * - Many-to-Many (via vkProgression): VKSequence
 * @example
 * // Create new user
 * const user = new User({
 *   name: "John Doe",
 *   email: "john@example.com",
 *   password: "SecurePass123", // Automatically hashed
 *   goals: ["reduce_stress", "improve_balance"],
 *   vkProgression: {
 *     unlockedFamilies: ["tadasana"],
 *     currentMainSequence: null,
 *     completedSequences: []
 *   }
 * });
 * await user.save();
 *
 * @example
 * // Check level access
 * const canAccess = user.canAccessLevel("tadasana", 2); // false if didn't complete level 1
 * // Mark sequence as completed
 * await user.markSequenceCompleted("tadasana", 1, sequenceId);
 */
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
	{
		// BASIC INFO
		name: { type: String, trim: true, required: true, maxlength: 50 },
		email: {
			type: String,
			trim: true,
			required: true,
			unique: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
		},
		password: {
			type: String,
			trim: true,
			required: true,
			minlength: [8, "Password 8 characters minimum"],
			select: false,
		},
		passwordResetToken: {
			type: String,
			select: false,
		},
		passwordResetExpires: {
			type: Date,
			select: false,
		},
		role: { type: String, enum: ["user", "admin"], default: "user" },
		profileImageUrl: { type: String, trim: true },
		profileImageId: { type: String, trim: true },

		// VK-SPECIFIC GOALS
		goals: [
			{
				type: String,
				enum: [
					"increase_flexibility",
					"build_strength",
					"reduce_stress",
					"improve_balance",
					"therapeutic_healing",
					"deepen_practice",
					"meditation_focus",
					"breath_awareness",
				],
			},
		],

		// TRACKING
		totalSessions: { type: Number, default: 0 },
		totalMinutes: { type: Number, default: 0 },
		currentStreak: { type: Number, default: 0 },
		lastPracticeDate: { type: Date },

		// VK-SPECIFIC PROGRESSION TRACKING
		vkProgression: {
			currentMainSequence: {
				family: { type: String },
				level: { type: Number, enum: [1, 2, 3] },
				sequenceId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "VKSequence",
				},
			},
			completedSequences: [
				{
					family: { type: String },
					level: { type: Number },
					sequenceId: {
						type: mongoose.Schema.Types.ObjectId,
						ref: "VKSequence",
					},
					completedAt: { type: Date, default: Date.now },
					sessionCount: { type: Number, default: 1 }, // How many times they practiced this sequence
				},
			],
			unlockedFamilies: [
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
		},

		// PRACTICE PREFERENCES (VK-adapted)
		preferences: {
			practiceIntensity: {
				type: String,
				enum: ["gentle", "moderate", "vigorous"],
				default: "moderate",
			},
			sessionDuration: { type: Number, default: 30 },
			timeOfDay: {
				type: String,
				enum: ["morning", "afternoon", "evening", "anytime"],
				default: "anytime",
			},
			therapeuticFocus: {
				enabled: { type: Boolean, default: false },
				targetAreas: [
					{
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
					},
				],
				conditions: [{ type: String, trim: true }], // e.g. "lower back pain"
			},
			meditativeEmphasis: {
				type: Boolean,
				default: false,
			},
			pranayamaPreference: {
				includeInPractice: { type: Boolean, default: true },
				preferredDuration: { type: Number, default: 5 }, // minutes
			},
			notifications: {
				enabled: { type: Boolean, default: true },
				frequency: {
					type: String,
					enum: ["daily", "weekly", "never"],
					default: "weekly",
				},
				reminderTime: { type: String, default: "09:00" }, // HH:mm format
			},
			language: {
				type: String,
				enum: ["en", "es"],
				default: "en",
			},
			theme: {
				type: String,
				enum: ["light", "dark"],
				default: "light",
			},
			uiPreferences: {
				showSanskritNames: { type: Boolean, default: true },
				audioGuidance: { type: Boolean, default: true },
				visualMetronome: { type: Boolean, default: true },
			},
		},
	},
	{ timestamps: true, versionKey: false },
);

// VALIDATION

// Hash password before saving
userSchema.pre("save", async function () {
	// Skip hashing if password hasn't been modified
	if (!this.isModified("password")) {
		return;
	}

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
	} catch (error) {
		throw new Error(`Password hashing failed: ${error.message}`);
	}
});

// METHODS

// METHOD: Check if user can access a specific level
userSchema.methods.canAccessLevel = function (family, level) {
	// Level 1 is always unlocked
	if (level === 1) return true;

	// For levels 2 and 3, verify they completed previous level
	const previousLevel = level - 1;
	const hasCompletedPrevious = this.vkProgression.completedSequences.some(
		(seq) => seq.family === family && seq.level === previousLevel,
	);

	return hasCompletedPrevious;
};

// METHOD: Mark sequence as completed
userSchema.methods.markSequenceCompleted = function (
	family,
	level,
	sequenceId,
) {
	const existingIndex = this.vkProgression.completedSequences.findIndex(
		(seq) =>
			seq.family === family &&
			seq.level === level &&
			seq.sequenceId.toString() === sequenceId.toString(),
	);

	if (existingIndex >= 0) {
		// Already exists, increment session count
		this.vkProgression.completedSequences[existingIndex].sessionCount += 1;
	} else {
		// New completed sequence
		this.vkProgression.completedSequences.push({
			family,
			level,
			sequenceId,
			completedAt: new Date(),
			sessionCount: 1,
		});

		// Unlock family if not already unlocked
		if (!this.vkProgression.unlockedFamilies.includes(family)) {
			this.vkProgression.unlockedFamilies.push(family);
		}
	}

	return this.save();
};

// INDEXES
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ "vkProgression.currentMainSequence.family": 1 });
userSchema.index({ "vkProgression.unlockedFamilies": 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
