/**
 * @schema SessionTemplate
 * @description Saved session configurations for quick re-use
 *
 * Stores a snapshot of planned blocks with config so tutors (or any user)
 * can re-launch a "what worked last time" session instantly.
 *
 * Relationships:
 * - Belongs to: User (via `user`)
 * - Optionally linked to: ChildProfile (via `childProfile`)
 */
const mongoose = require("mongoose");

const templateBlockSchema = new mongoose.Schema(
	{
		blockType: {
			type: String,
			enum: ["vk_sequence", "pranayama", "meditation"],
			required: true,
		},
		label: { type: String, required: true },
		durationMinutes: { type: Number, required: true, min: 1 },
		order: { type: Number, required: true },
		vkSequence: { type: mongoose.Schema.Types.ObjectId, ref: "VKSequence" },
		breathingPattern: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "BreathingPattern",
		},
		meditationType: { type: String },
		guided: { type: Boolean, default: true },
		level: {
			type: String,
			enum: ["beginner", "intermediate", "advanced"],
			default: "beginner",
		},
		config: { type: mongoose.Schema.Types.Mixed, default: {} },
	},
	{ _id: false, versionKey: false },
);

const sessionTemplateSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		childProfile: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ChildProfile",
		},
		name: {
			type: String,
			trim: true,
			required: true,
			maxlength: 80,
		},
		sessionType: {
			type: String,
			enum: ["vk_sequence", "pranayama", "meditation", "complete_practice"],
			required: true,
		},
		blocks: {
			type: [templateBlockSchema],
			validate: [(val) => val.length > 0, "At least one block is required"],
		},
		totalMinutes: { type: Number, required: true, min: 1 },
		preset: {
			type: String,
			enum: ["adult", "tutor"],
			default: "adult",
		},
		usageCount: { type: Number, default: 0 },
		lastUsedAt: { type: Date },
	},
	{ timestamps: true, versionKey: false },
);

sessionTemplateSchema.index({ user: 1, createdAt: -1 });
sessionTemplateSchema.index({ user: 1, childProfile: 1 });

const SessionTemplate = mongoose.model("SessionTemplate", sessionTemplateSchema);

module.exports = SessionTemplate;
