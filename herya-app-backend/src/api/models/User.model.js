const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
	{
		name: { type: String, trim: true, required: true },
		email: {
			type: String,
			trim: true,
			required: true,
			unique: true,
			lowercase: true,
		},
		password: {
			type: String,
			trim: true,
			required: true,
			minlength: [8, "Password 8 characters minimum"],
		},
		profileImageUrl: { type: String, trim: true },
		profileImageId: { type: String, trim: true },
		level: {
			type: String,
			enum: ["beginner", "intermediate", "advanced"],
			default: "beginner",
		},
		goals: [{ type: String, trim: true }],
		totalSessions: { type: Number, default: 0 },
		totalMinutes: { type: Number, default: 0 },
		currentStreak: { type: Number, default: 0 },
		lastPracticeDate: { type: Date },
	},
	{ timestamps: true, versionKey: false },
);

// Solo hashear si la contraseña fue modificada
userSchema.pre("save", async function () {
	if (!this.isModified("password")) {
		return;
	}
	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
	} catch (error) {
		throw error;
	}
});

// INDEX
userSchema.index({ email: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;
