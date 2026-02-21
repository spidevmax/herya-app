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

module.exports = {
	getBreathingPatterns,
	getBreathingPatternById,
};
