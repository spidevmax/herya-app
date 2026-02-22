const VinyasaKramaSequence = require("../models/VinyasaKramaSequence.model");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

const VKSequence = VinyasaKramaSequence;

/**
 * Controller: getSequences
 * -----------------------
 * Fetches all VK sequences with optional filters and pagination.
 *
 * Query Parameters:
 * - family: Optional, filter by VK family
 * - level: Optional, filter by level (1-3)
 * - difficulty: Optional, filter by difficulty
 * - page: Optional, page number (default: 1)
 * - limit: Optional, results per page (default: 20)
 * - unlocked: Optional, for authenticated users to filter accessible sequences
 *
 * Workflow:
 * 1. Builds filter from query parameters
 * 2. For authenticated users with unlocked="true", checks accessibility
 * 3. Applies pagination
 * 4. Returns sequences with pagination metadata
 *
 * Error Handling:
 * - Database errors passed to next(error)
 *
 * Notes:
 * - Level 1 is always accessible
 * - Higher levels require user.canAccessLevel() check
 * - Sorted by family, then level
 */
const getSequences = async (req, res, next) => {
	try {
		const { family, level, difficulty, page = 1, limit = 20, unlocked } = req.query;

		// Build filter
		const filter = {};

		if (family) filter.family = family;
		if (level) filter.level = parseInt(level, 10);
		if (difficulty) filter.difficulty = difficulty;

		// Handle unlocked sequences for authenticated users
		if (unlocked === "true" && req.user) {
			const user = req.user;

			if (family) {
				// Check if user can access this family
				// Level 1 always accessible, higher levels require previous completion
				const maxLevel = user.canAccessLevel ? await user.canAccessLevel(family, 3) : 1;
				filter.level = { $lte: maxLevel };
			}
		}

		// Pagination
		const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

		const sequences = await VKSequence.find(filter)
			.populate("structure.corePoses.pose")
			.populate("prerequisites")
			.populate("nextSteps.sequence")
			.populate("recommendedPranayama.pattern")
			.sort({ family: 1, level: 1 })
			.skip(skip)
			.limit(parseInt(limit, 10));

		const total = await VKSequence.countDocuments(filter);

		return sendResponse(res, 200, true, "Sequences retrieved successfully", {
			sequences,
			pagination: {
				page: parseInt(page, 10),
				limit: parseInt(limit, 10),
				total,
				pages: Math.ceil(total / parseInt(limit, 10)),
			},
		});
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getSequenceById
 * ---------------------------
 * Retrieves a single sequence by ID with full population.
 *
 * URL Parameters:
 * - id: MongoDB ObjectId of the sequence
 *
 * Workflow:
 * 1. Finds sequence by ID
 * 2. Populates all related references (poses, sequences, patterns)
 * 3. Returns 404 if not found
 * 4. Returns complete sequence data
 *
 * Error Handling:
 * - 404: Sequence not found
 * - Invalid ObjectId is caught by validation middleware
 *
 * Notes:
 * - Full population for detailed sequence view
 * - Includes structure, prerequisites, next steps, and pranayama
 */
const getSequenceById = async (req, res, next) => {
	try {
		const { id } = req.params;

		const sequence = await VKSequence.findById(id)
			.populate("structure.corePoses.pose")
			.populate("structure.corePoses.counterpose.pose")
			.populate("structure.entry.fromPose")
			.populate("structure.entry.steps.pose")
			.populate("structure.exit.toPose")
			.populate("structure.exit.steps.pose")
			.populate("prerequisites")
			.populate("nextSteps.sequence")
			.populate("recommendedPranayama.pattern");

		if (!sequence) {
			throw createError(404, "Sequence not found");
		}

		return sendResponse(res, 200, true, "Sequence retrieved successfully", sequence);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getSequencesByFamily
 * ---------------------------------
 * Gets all sequences within a specific VK family, organized by level.
 *
 * Workflow:
 * 1. Finds all sequences in the specified family.
 * 2. Sorts by level (1, 2, 3).
 * 3. For authenticated users, marks which sequences are unlocked.
 * 4. Returns organized list.
 *
 * Error Handling:
 * - 400: Invalid family name
 * - Database errors
 *
 * Notes:
 * - Useful for showing progression path within a family.
 * - Client can display locked/unlocked UI based on user progression.
 */
const getSequencesByFamily = async (req, res, next) => {
	try {
		const { family } = req.params;

		const validFamilies = [
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
		];

		if (!validFamilies.includes(family)) {
			throw createError(400, "Invalid VK family");
		}

		const sequences = await VKSequence.find({ family })
			.populate("structure.corePoses.pose")
			.sort({ level: 1 });

		// Mark which sequences are accessible if user is authenticated
		let sequencesWithAccess = sequences;
		if (req.user) {
			sequencesWithAccess = sequences.map((seq) => {
				const seqObj = seq.toObject();
				seqObj.isAccessible = seq.level === 1 || req.user.canAccessLevel(family, seq.level);
				return seqObj;
			});
		}

		return sendResponse(
			res,
			200,
			true,
			`Sequences for ${family} retrieved successfully`,
			sequencesWithAccess,
		);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getRecommendedSequence
 * -----------------------------------
 * Recommends a VK sequence based on user's history and therapeutic needs.
 *
 * Workflow:
 * 1. Analyzes user's last 5 journal entries.
 * 2. Identifies body areas with poor improvement.
 * 3. Finds sequences targeting those areas.
 * 4. Filters by user's accessible level.
 * 5. Prioritizes sequences not recently practiced.
 * 6. Returns recommended sequence with reasoning.
 *
 * Error Handling:
 * - 401: User not authenticated
 * - Returns null if no suitable recommendation found
 *
 * Notes:
 * - Analyzes user's practice history (journal entries and sessions) to identify weak areas.
 * - Recommends sequences that target problematic body areas for therapeutic focus.
 * - Balances therapeutic focus with variety by avoiding recently practiced families.
 * - Falls back to next progression step if no issues found.
 * - Fallback to beginner standing sequence if no progression path exists.
 */
const getRecommendedSequence = async (req, res, next) => {
	try {
		if (!req.user) {
			throw createError(401, "Authentication required for recommendations");
		}

		const JournalEntry = require("../models/JournalEntry.model");
		const Session = require("../models/Session.model");

		// Get last 5 journal entries
		const recentJournals = await JournalEntry.find({ user: req.user._id })
			.sort({ createdAt: -1 })
			.limit(5)
			.populate("session");

		// Analyze problematic body areas
		const problematicAreas = [];
		recentJournals.forEach((journal) => {
			if (journal.vkReflection?.anatomicalObservations) {
				journal.vkReflection.anatomicalObservations.forEach((obs) => {
					if (obs.improvement === "none" || obs.improvement === "regressed") {
						problematicAreas.push(obs.area);
					}
				});
			}
		});

		let recommendedSequence = null;
		let reason = "";

		if (problematicAreas.length > 0) {
			// Find sequence targeting problematic areas
			const areaFrequency = problematicAreas.reduce((acc, area) => {
				acc[area] = (acc[area] || 0) + 1;
				return acc;
			}, {});

			const mostProblematicArea = Object.keys(areaFrequency).reduce((a, b) =>
				areaFrequency[a] > areaFrequency[b] ? a : b,
			);

			// Get recently practiced families to avoid repetition
			const recentSessions = await Session.find({ user: req.user._id })
				.sort({ date: -1 })
				.limit(3)
				.populate("vkSequence");

			const recentFamilies = recentSessions.map((s) => s.vkSequence?.family).filter(Boolean);

			recommendedSequence = await VKSequence.findOne({
				"therapeuticFocus.anatomicalFocus.area": mostProblematicArea,
				level: { $lte: 2 }, // Keep it accessible
				family: { $nin: recentFamilies }, // Avoid recent families
			}).populate("structure.corePoses.pose");

			reason = `Recommended to address ${mostProblematicArea} (showing no improvement in recent practices)`;
		} else {
			// No issues found, suggest next progression step
			if (req.user.vkProgression?.currentMainSequence?.sequenceId) {
				const currentSequence = await VKSequence.findById(
					req.user.vkProgression.currentMainSequence.sequenceId,
				).populate("nextSteps.sequence");

				if (currentSequence?.nextSteps?.length > 0) {
					recommendedSequence = currentSequence.nextSteps[0].sequence;
					reason = "Suggested next step in your progression path";
				}
			}

			// Fallback to beginner standing sequence
			if (!recommendedSequence) {
				recommendedSequence = await VKSequence.findOne({
					family: "standing_asymmetric",
					level: 1,
				}).populate("structure.corePoses.pose");
				reason = "Great foundational sequence to continue your practice";
			}
		}

		return sendResponse(res, 200, true, "Recommendation generated successfully", {
			sequence: recommendedSequence,
			reason,
		});
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: searchSequences
 * ----------------------------
 * Full-text search across sequences.
 *
 * Query Parameters:
 * - q: Search query (searches sanskritName, englishName, description, tags)
 * - family: Optional family filter
 * - difficulty: Optional difficulty filter
 *
 * Workflow:
 * 1. Performs text search using MongoDB text index.
 * 2. Applies additional filters if provided.
 * 3. Sorts by text score relevance.
 * 4. Returns matching sequences.
 *
 * Error Handling:
 * - 400: No search query provided
 * - Database errors
 *
 * Notes:
 * - Requires text index on sanskritName, englishName, description fields.
 * - Searches tags as well for flexible discovery.
 */
const searchSequences = async (req, res, next) => {
	try {
		const { q, family, difficulty } = req.query;

		if (!q) {
			throw createError(400, "Search query is required");
		}

		const filter = {
			$text: { $search: q },
		};

		if (family) filter.family = family;
		if (difficulty) filter.difficulty = difficulty;

		const sequences = await VKSequence.find(filter, {
			score: { $meta: "textScore" },
		})
			.populate("structure.corePoses.pose")
			.sort({ score: { $meta: "textScore" } })
			.limit(20);

		return sendResponse(res, 200, true, `Found ${sequences.length} sequences`, sequences);
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getSequences,
	getSequenceById,
	getSequencesByFamily,
	getRecommendedSequence,
	searchSequences,
};
