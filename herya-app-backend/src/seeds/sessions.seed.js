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

		const sequence = await VKSequence.findOne();
		const breathingPattern = await BreathingPattern.findOne();

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
			throw new Error(`CSV parsing errors: ${errors.map((e) => e.message).join(", ")}`);
		}

		/*
		 * Which user each session belongs to is read from the CSV.
		 *
		 * It used to use User.findOne(), which returns whichever user was saved
		 * first. That is always the admin, because users.seed creates it before
		 * the ones in the CSV. The app hides /sessions and /journal from admins,
		 * so all the seeded practice existed but nobody could see it.
		 */
		const emails = [...new Set(data.map((row) => row.userEmail).filter(Boolean))];
		const owners = await User.find({ email: { $in: emails } }, { _id: 1, email: 1 }).lean();
		const userIdByEmail = new Map(owners.map((u) => [u.email, u._id]));

		// Give each user their own run of dates, ending today and going back one
		// day at a time. If we used a single counter for everyone, each user
		// would end up with gaps between their sessions and no streak.
		const rowsByEmail = new Map();
		for (const row of data) {
			if (!rowsByEmail.has(row.userEmail)) rowsByEmail.set(row.userEmail, []);
			rowsByEmail.get(row.userEmail).push(row);
		}
		const dayOffset = new Map();
		for (const rows of rowsByEmail.values()) {
			for (let index = 0; index < rows.length; index++) {
				dayOffset.set(rows[index], rows.length - 1 - index);
			}
		}

		let count = 0;
		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			const daysAgo = dayOffset.get(row) ?? 0;
			const sessionType = row.sessionType;

			const ownerId = userIdByEmail.get(row.userEmail);
			if (!ownerId) {
				console.log(`⚠️  Skipping session – user ${row.userEmail} not found`);
				continue;
			}

			// Skip vk_sequence / complete_practice if no VKSequence was seeded
			if (!sequence && (sessionType === "vk_sequence" || sessionType === "complete_practice")) {
				console.log(`⚠️  Skipping '${sessionType}' session – no VK sequence found`);
				continue;
			}

			const sessionData = {
				user: ownerId,
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
					// We leave completePractice.meditation.type out on purpose.
					// Mongoose treats a field called "type" as a way of declaring
					// what kind of data a field holds, not as a field of its own,
					// so setting it here makes the save fail.
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
