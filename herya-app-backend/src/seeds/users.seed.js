const User = require("../api/models/User.model");
const { hashPassword } = require("../utils/bcrypt");

async function seedUsers() {
	try {
		// Check if users already exist
		const existingUsers = await User.countDocuments();
		if (existingUsers > 0) {
			console.log("⏭️  Users already seeded, skipping...");
			return;
		}

		const users = [
			{
				name: "Maria Lopez",
				email: "maria@example.com",
				password: "password123",
				level: "beginner",
				goals: ["Reduce stress", "Improve flexibility"],
				totalSessions: 5,
				totalMinutes: 150,
				currentStreak: 2,
				lastPracticeDate: new Date(),
			},
			{
				name: "Juan Martínez",
				email: "juan@example.com",
				password: "password123",
				level: "intermediate",
				goals: ["Build strength", "Daily practice"],
				totalSessions: 25,
				totalMinutes: 1250,
				currentStreak: 5,
				lastPracticeDate: new Date(),
			},
			{
				name: "Ana García",
				email: "ana@example.com",
				password: "password123",
				level: "advanced",
				goals: ["Master advanced poses", "Help others"],
				totalSessions: 100,
				totalMinutes: 5000,
				currentStreak: 15,
				lastPracticeDate: new Date(),
			},
			{
				name: "Carlos Rodríguez",
				email: "carlos@example.com",
				password: "password123",
				level: "beginner",
				goals: ["Start yoga journey"],
				totalSessions: 2,
				totalMinutes: 60,
				currentStreak: 1,
				lastPracticeDate: new Date(),
			},
			{
				name: "Sofia Pérez",
				email: "sofia@example.com",
				password: "password123",
				level: "intermediate",
				goals: ["Improve meditation", "Better sleep"],
				totalSessions: 15,
				totalMinutes: 600,
				currentStreak: 3,
				lastPracticeDate: new Date(),
			},
		];

		// Hash passwords before inserting
		const usersWithHashedPasswords = users.map((user) => ({
			...user,
			password: hashPassword(user.password),
		}));

		await User.insertMany(usersWithHashedPasswords);
		console.log(`✅ Seeded ${users.length} users`);
	} catch (error) {
		console.error("❌ Error seeding users:", error);
		throw error;
	}
}

module.exports = seedUsers;
