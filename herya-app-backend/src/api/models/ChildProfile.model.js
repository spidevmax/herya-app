/**
 * @schema ChildProfile
 * @description Profile for children managed by tutor users
 *
 * Stores per-child sensory preferences, safety anchors, known triggers,
 * and session history metadata. Linked to a tutor (User with role: "tutor").
 *
 * Relationships:
 * - Belongs to: User (tutor) via `tutor` field
 * - Referenced by: Session via `childProfile` (optional)
 */
const mongoose = require("mongoose");

const childProfileSchema = new mongoose.Schema(
	{
		tutor: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		name: {
			type: String,
			trim: true,
			required: true,
			maxlength: 60,
		},
		age: {
			type: Number,
			min: 3,
			max: 18,
		},
		avatarColor: {
			type: String,
			trim: true,
			default: "#7C6FD4",
			match: /^#[0-9a-fA-F]{6}$/,
		},
		sensoryPreferences: {
			lowStimDefault: { type: Boolean, default: true },
			preferredTheme: {
				type: String,
				enum: ["light", "dark", "nature", "ocean", "sunset"],
				default: "light",
			},
			soundPalette: {
				type: String,
				enum: ["nature", "simple_tones", "silence"],
				default: "simple_tones",
			},
			animationSpeed: {
				type: String,
				enum: ["slow", "normal", "reduced"],
				default: "slow",
			},
		},
		safetyAnchors: {
			phrase: { type: String, trim: true, maxlength: 120, default: "" },
			bodyCue: { type: String, trim: true, maxlength: 120, default: "" },
		},
		knownTriggers: [
			{
				type: String,
				trim: true,
				maxlength: 200,
			},
		],
		contraindications: [
			{
				type: String,
				trim: true,
				maxlength: 200,
			},
		],
		notes: {
			type: String,
			trim: true,
			maxlength: 2000,
		},
		active: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true, versionKey: false },
);

childProfileSchema.index({ tutor: 1, active: 1 });
childProfileSchema.index({ tutor: 1, name: 1 });

const ChildProfile = mongoose.model("ChildProfile", childProfileSchema);

module.exports = ChildProfile;
