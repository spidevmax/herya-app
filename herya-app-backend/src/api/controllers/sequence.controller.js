const Sequence = require("../models/Sequence.model");

/**
 * GET /api/v1/sequences/
 * - Fetches all sequences.
 * - If successful, responds 200 with the array of sequences.
 */
const getSequences = async (req, res, next) => {
	try {
		const sequences = await Sequence.find().sort({ createdAt: -1 });
		res.status(200).json(sequences);
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/sequences/:id
 * - Finds a sequence by ID.
 * - If not found, returns 404.
 * - If ID format is invalid, returns 400.
 */
const getSequenceById = async (req, res, next) => {
	try {
		const sequence = await Sequence.findById(req.params.id).populate(
			"blocks.poses.pose",
		);
		if (!sequence) {
			return res.status(404).json({ error: "Sequence not found" });
		}
		res.status(200).json(sequence);
	} catch (error) {
		return next(error);
	}
};

/**
 * POST /api/v1/sequences/
 * - Creates a new sequence.
 * - Applies Schema validations automatically.
 * - If creation is successful, returns 201 with the created document.
 */
const createSequence = async (req, res, next) => {
	try {
		const sequence = await Sequence.create(req.body);
		res.status(201).json(sequence);
	} catch (error) {
		return next(error);
	}
};

/**
 * PUT /api/v1/sequences/:id
 * - Updates an existing sequence.
 * - { new: true } returns the updated document.
 * - { runValidators: true } respects Schema validations.
 * - If not found, 404. If successful, 200.
 */
const updateSequence = async (req, res, next) => {
	try {
		const updated = await Sequence.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		}).populate("blocks.poses.pose");
		if (!updated) {
			return res.status(404).json({ error: "Sequence not found" });
		}
		res.status(200).json(updated);
	} catch (error) {
		return next(error);
	}
};

/**
 * DELETE /api/v1/sequences/:id
 * - Deletes a sequence by ID.
 * - If not found, 404. If deleted, 200 with confirmation message.
 */
const deleteSequence = async (req, res, next) => {
	try {
		const deleted = await Sequence.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: "Sequence not found" });
		}
		res.status(200).json({ message: "Sequence deleted successfully" });
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/sequences/level/:level
 * - Returns all sequences for a specific level.
 */
const getSequencesByLevel = async (req, res, next) => {
	try {
		const { level } = req.params;
		const sequences = await Sequence.find({ level }).sort({
			createdAt: -1,
		});
		res.status(200).json(sequences);
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/sequences/style/:style
 * - Returns all sequences for a specific style.
 */
const getSequencesByStyle = async (req, res, next) => {
	try {
		const { style } = req.params;
		const sequences = await Sequence.find({ style }).sort({
			createdAt: -1,
		});
		res.status(200).json(sequences);
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getSequences,
	getSequenceById,
	createSequence,
	updateSequence,
	deleteSequence,
	getSequencesByLevel,
	getSequencesByStyle,
};
