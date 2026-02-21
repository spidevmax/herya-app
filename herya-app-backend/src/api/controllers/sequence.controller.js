const VinyasaKramaSequence = require("../models/VinyasaKramaSequence.model");

/**
 * GET /api/v1/sequences/
 * - Fetches system templates + user's custom sequences.
 * - Or just system templates if user is not authenticated.
 */
const getSequences = async (req, res, next) => {
	try {
		let query = { isSystemTemplate: true }; // Always show system templates

		// If user is authenticated, also show their custom sequences
		if (req.user) {
			query = {
				$or: [
					{ isSystemTemplate: true },
					{ createdBy: req.user.id, isSystemTemplate: false },
				],
			};
		}

		const sequences = await VinyasaKramaSequence.find(query)
			.populate("createdBy", "name")
			.sort({ createdAt: -1 });
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
		const sequence = await VinyasaKramaSequence.findById(
			req.params.id,
		).populate("blocks.poses.pose");
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
 * - Creates a new custom sequence for the user.
 * - Can only set isSystemTemplate: true if admin
 * - Non-admin users always create custom sequences (isSystemTemplate: false)
 */
const createSequence = async (req, res, next) => {
	try {
		const sequenceData = {
			...req.body,
			createdBy: req.user.id,
		};

		// Non-admin users cannot create system templates
		if (req.user.role !== "admin") {
			sequenceData.isSystemTemplate = false;
		}

		const sequence = await VinyasaKramaSequence.create(sequenceData);
		const populated = await sequence.populate("createdBy", "name");
		res.status(201).json(populated);
	} catch (error) {
		return next(error);
	}
};

/**
 * PUT /api/v1/sequences/:id
 * - Updates an existing sequence.
 * - User can only update their own custom sequences
 * - Admin can update any sequence
 * - Cannot change isSystemTemplate or createdBy
 */
const updateSequence = async (req, res, next) => {
	try {
		const sequence = await VinyasaKramaSequence.findById(req.params.id);
		if (!sequence) {
			return res.status(404).json({ error: "Sequence not found" });
		}

		// Check permissions: must be creator/admin or it's a system template
		const isCreator = sequence.createdBy?.toString() === req.user.id;
		const isAdmin = req.user.role === "admin";

		if (!isAdmin && !isCreator) {
			return res
				.status(403)
				.json({ error: "No tienes permiso para editar esta secuencia" });
		}

		// Prevent changes to isSystemTemplate and createdBy
		delete req.body.isSystemTemplate;
		delete req.body.createdBy;

		const updated = await VinyasaKramaSequence.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			},
		).populate("createdBy", "name");
		res.status(200).json(updated);
	} catch (error) {
		return next(error);
	}
};

/**
 * DELETE /api/v1/sequences/:id
 * - Deletes a sequence by ID.
 * - User can only delete their own custom sequences
 * - Admin can delete any sequence
 */
const deleteSequence = async (req, res, next) => {
	try {
		const sequence = await VinyasaKramaSequence.findById(req.params.id);
		if (!sequence) {
			return res.status(404).json({ error: "Sequence not found" });
		}

		// Check permissions: must be creator/admin
		const isCreator = sequence.createdBy?.toString() === req.user.id;
		const isAdmin = req.user.role === "admin";

		if (!isAdmin && !isCreator) {
			return res
				.status(403)
				.json({ error: "No tienes permiso para eliminar esta secuencia" });
		}

		await VinyasaKramaSequence.findByIdAndDelete(req.params.id);
		res.status(200).json({ message: "Sequence deleted successfully" });
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/sequences/difficulty/:difficulty
 * - Returns all sequences for a specific difficulty level.
 */
const getSequencesByDifficulty = async (req, res, next) => {
	try {
		const { difficulty } = req.params;
		const sequences = await VinyasaKramaSequence.find({ difficulty }).sort({
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
		const sequences = await VinyasaKramaSequence.find({ style }).sort({
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
	getSequencesByDifficulty,
	getSequencesByStyle,
};
