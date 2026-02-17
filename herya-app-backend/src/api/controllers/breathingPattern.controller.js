const BreathingPattern = require("../models/BreathingPattern.model");

/**
 * GET /api/v1/breathing-patterns/
 * - Fetches all breathing patterns stored.
 * - If successful, responds 200 with the array of breathing patterns.
 */
const getBreathingPatterns = async (req, res, next) => {
	try {
		const breathingPatterns = await BreathingPattern.find();
		res.status(200).json(breathingPatterns);
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/breathing-patterns/:id
 * - Finds a breathing pattern by ID.
 * - If not found, returns 404.
 * - If ID format is invalid, returns 400.
 */
const getBreathingPatternById = async (req, res, next) => {
	try {
		const breathingPattern = await BreathingPattern.findById(req.params.id);
		if (!breathingPattern) {
			return res.status(404).json({ error: "Breathing Pattern not found" });
		}
		res.status(200).json(breathingPattern);
	} catch (error) {
		return next(error);
	}
};

/**
 * POST /api/v1/breathing-patterns/
 * - Creates a new breathing pattern.
 * - Applies Schema validations automatically.
 * - If creation is successful, returns 201 with the created document.
 */
const createBreathingPattern = async (req, res, next) => {
	try {
		const breathingPattern = await BreathingPattern.create(req.body);
		res.status(201).json(breathingPattern);
	} catch (error) {
		return next(error);
	}
};

/**
 * PUT /api/v1/breathing-patterns/:id
 * - Updates an existing breathing pattern.
 * - { new: true } returns the updated document.
 * - { runValidators: true } respects Schema validations.
 * - If not found, 404. If successful, 200.
 */
const updateBreathingPattern = async (req, res, next) => {
	try {
		const updated = await BreathingPattern.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			},
		);
		if (!updated) {
			return res.status(404).json({ error: "Breathing Pattern not found" });
		}
		res.status(200).json(updated);
	} catch (error) {
		return next(error);
	}
};

/**
 * DELETE /api/v1/breathing-patterns/:id
 * - Deletes a breathing pattern by ID.
 * - If not found, 404. If deleted, 200 with confirmation message.
 */
const deleteBreathingPattern = async (req, res, next) => {
	try {
		const deleted = await BreathingPattern.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: "Breathing Pattern not found" });
		}
		res.status(200).json({ message: "Breathing pattern deleted successfully" });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getBreathingPatterns,
	getBreathingPatternById,
	createBreathingPattern,
	updateBreathingPattern,
	deleteBreathingPattern,
};
