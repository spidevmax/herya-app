const Pose = require("../models/Pose.model");

/**
 * GET /api/v1/poses/
 * - Fetches all stored poses.
 * - If successful, responds 200 with the array of poses.
 */
const getPoses = async (req, res, next) => {
	try {
		const poses = await Pose.find();
		res.status(200).json(poses);
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/poses/:id
 * - Finds a pose by ID.
 * - If not found, returns 404.
 * - If ID format is invalid, returns 400.
 */
const getPoseById = async (req, res, next) => {
	try {
		const { poseId } = req.params;
		const pose = await Pose.findById(poseId);
		if (!pose) {
			return res.status(404).json({ error: "Pose not found" });
		}
		res.status(200).json(pose);
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/poses/search?name=text
 * Searches for poses whose name contains the specified text.
 */
const searchPosesByName = async (req, res, next) => {
	try {
		const { name } = req.query;
		if (!name)
			return res.status(400).json({ error: "You must specify ?name=" });
		/* The first argument (name) is the text to search for.
        The second argument ("i") indicates that the search will be case-insensitive.
        */
		const poses = await Pose.find({ name: new RegExp(name, "i") });
		res.status(200).json(poses);
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/poses/category/:category
 * Returns all poses belonging to a specific category.
 */
const getPosesByCategory = async (req, res, next) => {
	try {
		const { category } = req.params;
		const poses = await Pose.find({ category });
		res.status(200).json(poses);
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/poses/difficulty/:difficulty
 * Returns all poses belonging to a specific difficulty.
 */
const getPosesByDifficulty = async (req, res, next) => {
	try {
		const { difficulty } = req.params;
		const poses = await Pose.find({ difficulty });
		res.status(200).json(poses);
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/poses/random
 * Returns a random pose from the collection.
 */
const getRandomPose = async (req, res, next) => {
	try {
		const total = await Pose.countDocuments();
		if (total === 0) {
			return res.status(404).json({ error: "No poses available" });
		}
		const randomIndex = Math.floor(Math.random() * total);
		const pose = await Pose.findOne().skip(randomIndex);
		res.status(200).json(pose);
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getPoses,
	getPoseById,
	postPose,
	updatePose,
	deletePose,
	searchPosesByName,
	getPosesByCategory,
	getPosesByDifficulty,
	getRandomPose,
	bulkCreatePoses,
};
