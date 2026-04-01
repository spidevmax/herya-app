const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");
const Session = require("../api/models/Session.model");
const User = require("../api/models/User.model");
const VKSequence = require("../api/models/VinyasaKramaSequence.model");
const BreathingPattern = require("../api/models/BreathingPattern.model");

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toUtcDayTimestamp(dateValue) {
	const date = new Date(dateValue);
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function calculateCurrentStreak(dates) {
	if (dates.length === 0) {
		return { currentStreak: 0, lastPracticeDate: undefined };
	}

	const uniqueDays = [];
	let previousDay = null;

	for (const sessionDate of dates) {
		const utcDay = toUtcDayTimestamp(sessionDate);
		if (utcDay !== previousDay) {
			uniqueDays.push(utcDay);
			previousDay = utcDay;
		}
	}

	let currentStreak = 1;
	for (let i = uniqueDays.length - 2; i >= 0; i--) {
		if (uniqueDays[i + 1] - uniqueDays[i] === DAY_IN_MS) {
			currentStreak += 1;
		} else {
			break;
		}
	}

	return {
		currentStreak,
		lastPracticeDate: new Date(uniqueDays[uniqueDays.length - 1]),
	};
}

async function rebuildUserPracticeStats() {
	const users = await User.find({}, { _id: 1 }).lean();

	for (const user of users) {
		const completedSessions = await Session.find(
			{ user: user._id, completed: true },
			{ duration: 1, date: 1 },
		)
			.sort({ date: 1 })
			.lean();

		const totalSessions = completedSessions.length;
		const totalMinutes = completedSessions.reduce(
			(total, session) => total + (Number(session.duration) || 0),
			0,
		);
		const { currentStreak, lastPracticeDate } = calculateCurrentStreak(
			completedSessions.map((session) => session.date),
		);

		await User.updateOne(
			{ _id: user._id },
			{
				$set: {
					totalSessions,
					totalMinutes,
					currentStreak,
					lastPracticeDate,
				},
			},
		);
	}
}

/**
 * Seed Sessions from CSV file.
 * Uses individual save() calls so the pre-save validation hook runs for each session.
 */
async function seedSessions() {
	try {
		const existingSessions = await Session.countDocuments();
		if (existingSessions > 0) {
			console.log("⏭️  Sessions already seeded, skipping...");
			return;
		}

		// Get user, sequence and breathing pattern for associations
		const user = await User.findOne();
		const sequence = await VKSequence.findOne();
		const breathingPattern = await BreathingPattern.findOne();

		if (!user) {
			console.log("⚠️  No users found, skipping session seeding");
			return;
		}

		// Read CSV file
		const csvPath = path.join(__dirname, "data", "sessions.csv");
		const csvContent = fs.readFileSync(csvPath, "utf-8");

		// Parse CSV
		const { data, errors } = Papa.parse(csvContent, {
			header: true,
			dynamicTyping: false,
			skipEmptyLines: true,
		});

		if (errors.length > 0) {
			throw new Error(
				`CSV parsing errors: ${errors.map((e) => e.message).join(", ")}`,
			);
		}

		let count = 0;
		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			const daysAgo = data.length - i;
			const sessionType = row.sessionType;

			// Skip vk_sequence / complete_practice if no VKSequence was seeded
			if (
				!sequence &&
				(sessionType === "vk_sequence" || sessionType === "complete_practice")
			) {
				console.log(
					`⚠️  Skipping '${sessionType}' session – no VK sequence found`,
				);
				continue;
			}

			const sessionData = {
				user: user._id,
				sessionType,
				date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
				duration: parseInt(row.duration, 10) || 30,
				completed: row.completed === "true",
				notes: row.notes || undefined,
			};

			// Attach vkSequence for vk_sequence sessions
			if (sessionType === "vk_sequence") {
				sessionData.vkSequence = sequence._id;
			}

			// Build completePractice for complete_practice sessions
			if (sessionType === "complete_practice") {
				sessionData.completePractice = {
					mainSequences: [sequence._id],
					...(breathingPattern && { pranayama: breathingPattern._id }),
					// NOTE: completePractice.meditation.type is a reserved Mongoose key;
					// skip it in the seed to avoid a cast error.
				};
			}

			const session = new Session(sessionData);
			await session.save(); // triggers pre-save validation hook
			count++;
		}

		await rebuildUserPracticeStats();

		console.log(`✅ Seeded ${count} sessions from CSV`);
	} catch (error) {
		console.error("❌ Error seeding sessions:", error.message);
		throw error;
	}
}

module.exports = seedSessions;
module.exports.rebuildUserPracticeStats = rebuildUserPracticeStats;
