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
 * POST /api/v1/poses/
 * - Creates a new pose.
 * - Applies Schema validations automatically.
 * - If creation is successful, returns 201 with the created document.
 */
const postPose = async (req, res, next) => {
	try {
		const newPose = new Pose(req.body);
		const savedPose = await newPose.save();
		res.status(201).json(savedPose);
	} catch (error) {
		return next(error);
	}
};

/**
 * PUT /api/v1/poses/:id
 * - Updates an existing pose.
 * - { new: true } returns the updated document.
 * - { runValidators: true } respects Schema validations.
 * - If not found, 404. If successful, 200.
 */
const updatePose = async (req, res, next) => {
	try {
		const { poseId } = req.params;
		const updatedPose = await Pose.findByIdAndUpdate(poseId, req.body, {
			new: true,
			runValidators: true,
		});
		if (!updatedPose) {
			return res.status(404).json({ error: "Pose not found" });
		}
		res.status(200).json(updatedPose);
	} catch (error) {
		return next(error);
	}
};

/**
 * DELETE /api/v1/poses/:id
 * - Deletes a pose by ID.
 * - If not found, 404. If deleted, 200 with confirmation message.
 */
const deletePose = async (req, res, next) => {
	try {
		const { poseId } = req.params;
		const deletedPose = await Pose.findByIdAndDelete(poseId);
		if (!deletedPose) {
			return res.status(404).json({ error: "Pose not found" });
		}
		res
			.status(200)
			.json({ message: "Pose deleted successfully", element: deletedPose });
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

/**
 * POST /api/v1/poses/bulk
 * Creates multiple poses in a single request.
 */
const bulkCreatePoses = async (req, res, next) => {
	try {
		const poses = req.body;
		if (!Array.isArray(poses) || poses.length === 0) {
			return res.status(400).json({ error: "You must send an array of poses" });
		}

		const inserted = await Pose.insertMany(poses);
		res.status(201).json({ quantity: inserted.length, poses: inserted });
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
