const Pose = require("../models/Pose.model");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

/**
 * Controller: getPoses
 * --------------------
 * Retrieves all stored poses with optional filtering, searching, and pagination.
 *
 * Query Parameters:
 * - category: Optional, filter by primary VK category
 * - difficulty: Optional, filter by difficulty level (beginner, intermediate, advanced)
 * - vkFamily: Optional, filter by VK family where pose appears
 * - sidedness: Optional, filter by sidedness type (single_sided, both_sides, symmetrical)
 * - drishti: Optional, filter by drishti (eye gaze direction)
 * - search: Optional, full-text search across name, romanization, IAST, Sanskrit, aliases, tags
 * - page: Optional, page number (default: 1)
 * - limit: Optional, results per page (default: 50, max: 100)
 *
 * Workflow:
 * 1. Builds filter object from query parameters
 * 2. Performs full-text search if search term provided
 * 3. Applies population of related poses
 * 4. Returns paginated results with metadata
 *
 * Search Behavior:
 * - Text search ranks results by relevance score
 * - Non-text results sorted alphabetically by pose name
 * - All related poses automatically populated (preparatory, follow-up, counterposes)
 *
 * Error Handling:
 * - Returns empty array if no matches (status 200)
 * - Database errors passed to next(error)
 *
 * Notes:
 * - Requires text index on schema for search functionality
 * - Large result sets are paginated to improve performance
 * - Public endpoint - no authentication required
 */
const getPoses = async (req, res, next) => {
	try {
		const {
			category,
			difficulty,
			vkFamily,
			sidedness,
			drishti,
			page = 1,
			limit = 50,
			search,
		} = req.query;

		// Build filter
		const filter = {};

		if (category) filter["vkCategory.primary"] = category;
		if (difficulty) filter.difficulty = difficulty;
		if (vkFamily) filter["vkContext.appearsInFamilies"] = vkFamily;
		if (sidedness) filter["sidedness.type"] = sidedness;
		if (drishti) filter.drishti = drishti;

		// Text search
		if (search) {
			filter.$text = { $search: search };
		}

		// Pagination
		const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

		let query = Pose.find(filter);

		// Add text score if searching
		if (search) {
			query = query.select({ score: { $meta: "textScore" } });
			query = query.sort({ score: { $meta: "textScore" } });
		} else {
			query = query.sort({ name: 1 });
		}

		const poses = await query
			.populate("preparatoryPoses")
			.populate("followUpPoses")
			.populate("recommendedCounterposes.pose")
			.skip(skip)
			.limit(parseInt(limit, 10));

		const total = await Pose.countDocuments(filter);

		return sendResponse(res, 200, true, "Poses retrieved successfully", {
			poses,
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
 * Controller: getPoseById
 * -----------------------
 * Retrieves a single pose by MongoDB ObjectId.
 *
 * Workflow:
 * 1. Validates ID format (must be valid MongoDB ObjectId).
 * 2. Finds pose by ID.
 * 3. Populates all related poses (preparatory, follow-up, counterposes).
 * 4. Returns complete pose data.
 *
 * Error Handling:
 * - 400: Invalid MongoDB ObjectId format
 * - 404: Pose not found
 *
 * Notes:
 * - Full population for detailed view.
 * - Shows complete pose relationships and progression context.
 */
const getPoseById = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Validate MongoDB ObjectId format
		if (!id.match(/^[0-9a-fA-F]{24}$/)) {
			throw createError(400, "Invalid pose ID format");
		}

		const pose = await Pose.findById(id)
			.populate("preparatoryPoses")
			.populate("followUpPoses")
			.populate("recommendedCounterposes.pose");

		if (!pose) {
			throw createError(404, "Pose not found");
		}

		return sendResponse(res, 200, true, "Pose retrieved successfully", pose);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getPosesByCategory
 * -------------------------------
 * Retrieves all poses within a specific VK category, sorted by difficulty.
 *
 * URL Parameters:
 * - category: VK category (must be one of valid categories)
 *
 * Valid Categories:
 * - standing_mountain, standing_asymmetric, standing_symmetric
 * - one_leg_balance, seated_forward, seated_twist, seated_hip_opener
 * - supine, prone, inverted, arm_support, backbend, meditative
 *
 * Workflow:
 * 1. Validates category against whitelist
 * 2. Finds all poses in that category
 * 3. Sorts by difficulty (beginner first) then by name
 * 4. Returns organized list
 *
 * Error Handling:
 * - 400: Invalid category
 * - Database errors passed to next(error)
 *
 * Notes:
 * - Useful for browsing poses by anatomical category
 * - Client can display category-wise pose library
 * - Validation applied via middleware before controller execution
 */
const getPosesByCategory = async (req, res, next) => {
	try {
		const { category } = req.params;

		const validCategories = [
			"standing_mountain",
			"standing_asymmetric",
			"standing_symmetric",
			"one_leg_balance",
			"seated_forward",
			"seated_twist",
			"seated_hip_opener",
			"supine",
			"prone",
			"inverted",
			"arm_support",
			"backbend",
			"meditative",
		];

		if (!validCategories.includes(category)) {
			throw createError(400, "Invalid pose category");
		}

		const poses = await Pose.find({ "vkCategory.primary": category }).sort({
			difficulty: 1,
			name: 1,
		});

		return sendResponse(res, 200, true, `Poses for ${category} retrieved successfully`, poses);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: searchPoses
 * -----------------------
 * Full-text search across poses.
 *
 * Query Parameters:
 * - q: Search query (searches name, romanization, IAST, Sanskrit, aliases, tags)
 * - difficulty: Optional difficulty filter
 * - category: Optional category filter
 *
 * Workflow:
 * 1. Performs text search using MongoDB text index.
 * 2. Applies additional filters if provided.
 * 3. Sorts by text score relevance.
 * 4. Returns matching poses.
 *
 * Error Handling:
 * - 400: No search query provided
 *
 * Notes:
 * - Requires text index on schema.
 * - Searches across multiple name fields and tags.
 */
const searchPoses = async (req, res, next) => {
	try {
		const { q, difficulty, category } = req.query;

		if (!q) {
			throw createError(400, "Search query is required");
		}

		const filter = {
			$text: { $search: q },
		};

		if (difficulty) filter.difficulty = difficulty;
		if (category) filter["vkCategory.primary"] = category;

		const poses = await Pose.find(filter, {
			score: { $meta: "textScore" },
		})
			.sort({ score: { $meta: "textScore" } })
			.limit(20);

		return sendResponse(res, 200, true, `Found ${poses.length} poses`, poses);
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getRelatedPoses
 * ----------------------------
 * Gets all poses related to a given pose (preparatory, follow-up, counterposes).
 * Shows the complete progression and counterbalancing context.
 *
 * Params:
 * - id: Base pose MongoDB ObjectId
 *
 * Workflow:
 * 1. Validates ID format.
 * 2. Finds the base pose.
 * 3. Retrieves all related poses via population.
 * 4. Organizes by relationship type.
 * 5. Returns structured data with base pose and relations.
 *
 * Error Handling:
 * - 400: Invalid pose ID format
 * - 404: Pose not found
 *
 * Notes:
 * - Useful for building custom sequences.
 * - Helps users understand pose progressions and contraindications.
 * - Essential for designing balanced practice flows.
 */
const getRelatedPoses = async (req, res, next) => {
	try {
		const { id } = req.params;

		// Validate MongoDB ObjectId format
		if (!id.match(/^[0-9a-fA-F]{24}$/)) {
			throw createError(400, "Invalid pose ID format");
		}

		const pose = await Pose.findById(id)
			.populate("preparatoryPoses")
			.populate("followUpPoses")
			.populate("recommendedCounterposes.pose");

		if (!pose) {
			throw createError(404, "Pose not found");
		}

		return sendResponse(res, 200, true, "Related poses retrieved", {
			basePose: {
				_id: pose._id,
				name: pose.name,
				sanskritName: pose.sanskritName,
			},
			preparatoryPoses: pose.preparatoryPoses,
			followUpPoses: pose.followUpPoses,
			counterposes: pose.recommendedCounterposes,
		});
	} catch (error) {
		return next(error);
	}
};

/**
 * Controller: getPosesByVKFamily
 * -------------------------------
 * Gets all poses that appear in a specific VK family sequence.
 * Groups poses by their role (primary, transition, counterpose, preparation).
 *
 * URL Parameters:
 * - family: VK family name (must be one of valid families)
 *
 * Valid Families:
 * - tadasana, standing_asymmetric, standing_symmetric, one_leg_standing
 * - seated, supine, prone, inverted, meditative
 * - bow_sequence, triangle_sequence, sun_salutation
 * - vajrasana_variations, lotus_variations
 *
 * Workflow:
 * 1. Validates family against whitelist
 * 2. Finds all poses where family appears
 * 3. Groups by role in sequence (primary, transition, etc.)
 * 4. Sorts by difficulty within each group
 * 5. Returns organized data structure
 *
 * Error Handling:
 * - 400: Invalid family name
 * - Database errors passed to next(error)
 *
 * Notes:
 * - Helps understand which poses are used in each VK family
 * - Useful for studying family-specific asanas and progressions
 * - Role assignment shows pose's function in the sequence
 * - Validation applied via middleware before controller execution
 */
const getPosesByVKFamily = async (req, res, next) => {
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

		const poses = await Pose.find({
			"vkContext.appearsInFamilies": family,
		}).sort({ difficulty: 1 });

		// Group by role
		const groupedPoses = {
			primary: [],
			counterpose: [],
			transition: [],
			preparation: [],
		};

		poses.forEach((pose) => {
			const role = pose.vkContext.roleInSequence || "primary";
			groupedPoses[role].push(pose);
		});

		return sendResponse(res, 200, true, `Poses for ${family} family retrieved`, groupedPoses);
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getPoses,
	getPoseById,
	getPosesByCategory,
	searchPoses,
	getRelatedPoses,
	getPosesByVKFamily,
};
