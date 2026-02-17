const mongoose = require("mongoose");

const poseSchema = new mongoose.Schema(
	{
		// IDENTIFICATION
		name: { type: String, required: true, trim: true },
		romanizationName: { type: String, required: true, trim: true },
		iastName: { type: String, required: true, trim: true }, // IAST transliteration
		sanskritName: { type: String, required: true, trim: true }, // in Devanagari script
		alias: [{ type: String, trim: true }],
		// CLASIFICATION
		category: [
			{
				type: String,
				enum: [
					"standing",
					"sitting_meditation",
					"reclining",
					"inverted",
					"balancing",
					"forward_bend",
					"backbend",
					"twisting",
					"hip_opening",
					"core_strength",
					"arm_balance",
					"restorative",
				],
				required: true,
			},
		],
		difficulty: {
			type: String,
			enum: ["beginner", "intermediate", "advanced"],
			default: "beginner",
			required: true,
		},
		// PHYSICAL ASPECTS
		bilateral: {
			type: Boolean,
			default: false, // true if the pose is performed on both sides
		},
		transitionType: {
			type: String,
			enum: ["static", "dynamic", "flow"], // static=hold, dynamic=movement, flow=part of a sequence
			default: "static",
		},
		// RECOMMENDED HOLD
		recommendedHold: {
			min: { type: Number, default: 30 }, // seconds
			max: { type: Number, default: 90 },
			default: { type: Number, default: 60 },
		},
		// EDUCATIONAL CONTENT
		instructions: {
			setup: [{ type: String, required: true, trim: true }], // how to get into the pose
			alignment: [{ type: String, trim: true }], // key alignment points
			modifications: [{ type: String, trim: true }], // variations for different levels
			exit: [{ type: String, required: true, trim: true }], // how to safely exit the pose
		},
		benefits: [{ type: String, required: true, trim: true }],
		contraindications: [{ type: String, trim: true }],
		breathingCue: {
			type: String,
			trim: true,
			default: "Breathe steadily and deeply",
		},
		commonMistakes: [{ type: String, trim: true }],
		// ANATOMICAL FOCUS
		targetMuscles: [{ type: String, trim: true }], // primary muscles worked
		jointFocus: [{ type: String, trim: true }], // joints involved
		// PROPS USAGE
		props: [{ type: String, trim: true }], // e.g., blocks, straps, bolsters
		// MULTIMEDIA
		media: {
			thumbnail: { type: String, trim: true },
			images: [{ type: String, trim: true }],
			videos: [{ type: String, trim: true }],
		},
		// ADDITIONAL INFO
		philosophicalAspect: { type: String, trim: true },
		chakraRelated: {
			type: String,
			enum: [
				"muladhara",
				"svadhisthana",
				"manipura",
				"anahata",
				"vishuddha",
				"ajna",
				"sahasrara",
			],
		},
		energyEffect: {
			type: String,
			enum: ["calming", "energizing", "balancing", "grounding"],
		},
		// RELATIONSHIPS WITH OTHER POSES
		preparatoryPoses: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Pose",
			},
		],
		followUpPoses: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Pose",
			},
		],
		// METADATA FOR SEARCH AND FILTERING
		tags: [{ type: String, trim: true }],
		isSystemPose: {
			// Indicates if the pose is a default/system pose
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

// INDEX
poseSchema.index({
	name: "text",
	romanizationName: "text",
	iastName: "text",
	sanskritName: "text",
	alias: "text",
	tags: "text",
});

poseSchema.index({ category: 1 });
poseSchema.index({ difficulty: 1 });
poseSchema.index({ energyEffect: 1 });
poseSchema.index({ chakraRelated: 1 });
poseSchema.index({ isSystemPose: 1 });

const Pose = mongoose.model("Pose", poseSchema);

module.exports = Pose;
