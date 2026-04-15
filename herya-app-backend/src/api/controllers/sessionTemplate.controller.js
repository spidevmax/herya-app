const SessionTemplate = require("../models/SessionTemplate.model");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

/**
 * GET /api/v1/session-templates
 * Optional query: ?childProfile=<id>
 */
const getSessionTemplates = async (req, res, next) => {
	try {
		const filter = { user: req.user._id };
		if (req.query.childProfile) {
			filter.childProfile = req.query.childProfile;
		}

		const templates = await SessionTemplate.find(filter)
			.sort({ lastUsedAt: -1, createdAt: -1 })
			.limit(50);

		sendResponse(res, 200, true, "Session templates retrieved", templates);
	} catch (err) {
		next(err);
	}
};

/**
 * GET /api/v1/session-templates/:id
 */
const getSessionTemplateById = async (req, res, next) => {
	try {
		const template = await SessionTemplate.findOne({
			_id: req.params.id,
			user: req.user._id,
		});

		if (!template) throw createError(404, "Session template not found");

		sendResponse(res, 200, true, "Session template retrieved", template);
	} catch (err) {
		next(err);
	}
};

/**
 * POST /api/v1/session-templates
 */
const createSessionTemplate = async (req, res, next) => {
	try {
		const template = await SessionTemplate.create({
			user: req.user._id,
			childProfile: req.body.childProfile || undefined,
			name: req.body.name,
			sessionType: req.body.sessionType,
			blocks: req.body.blocks,
			totalMinutes: req.body.totalMinutes,
			preset: req.body.preset || "adult",
		});

		sendResponse(res, 201, true, "Session template created", template);
	} catch (err) {
		next(err);
	}
};

/**
 * PUT /api/v1/session-templates/:id
 */
const updateSessionTemplate = async (req, res, next) => {
	try {
		const template = await SessionTemplate.findOne({
			_id: req.params.id,
			user: req.user._id,
		});

		if (!template) throw createError(404, "Session template not found");

		const allowedFields = [
			"name",
			"sessionType",
			"blocks",
			"totalMinutes",
			"preset",
			"childProfile",
		];

		for (const field of allowedFields) {
			if (req.body[field] !== undefined) {
				template[field] = req.body[field];
			}
		}

		await template.save();
		sendResponse(res, 200, true, "Session template updated", template);
	} catch (err) {
		next(err);
	}
};

/**
 * POST /api/v1/session-templates/:id/use
 * Increments usageCount and updates lastUsedAt.
 */
const useSessionTemplate = async (req, res, next) => {
	try {
		const template = await SessionTemplate.findOneAndUpdate(
			{ _id: req.params.id, user: req.user._id },
			{ $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } },
			{ new: true },
		);

		if (!template) throw createError(404, "Session template not found");

		sendResponse(res, 200, true, "Template usage recorded", template);
	} catch (err) {
		next(err);
	}
};

/**
 * DELETE /api/v1/session-templates/:id
 */
const deleteSessionTemplate = async (req, res, next) => {
	try {
		const template = await SessionTemplate.findOneAndDelete({
			_id: req.params.id,
			user: req.user._id,
		});

		if (!template) throw createError(404, "Session template not found");

		sendResponse(res, 200, true, "Session template deleted");
	} catch (err) {
		next(err);
	}
};

module.exports = {
	getSessionTemplates,
	getSessionTemplateById,
	createSessionTemplate,
	updateSessionTemplate,
	useSessionTemplate,
	deleteSessionTemplate,
};
