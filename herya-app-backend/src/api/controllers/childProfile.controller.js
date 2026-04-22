const ChildProfile = require("../models/ChildProfile.model");
const { sendResponse } = require("../../utils/sendResponse");
const { createError } = require("../../utils/createError");

/**
 * GET /api/v1/child-profiles
 * List all child profiles for the authenticated tutor.
 */
const getChildProfiles = async (req, res, next) => {
	try {
		const profiles = await ChildProfile.find({
			tutor: req.user._id,
			active: true,
		}).sort({ name: 1 });

		sendResponse(res, 200, true, "Child profiles retrieved", profiles);
	} catch (err) {
		next(err);
	}
};

/**
 * GET /api/v1/child-profiles/:id
 */
const getChildProfileById = async (req, res, next) => {
	try {
		const profile = await ChildProfile.findOne({
			_id: req.params.id,
			tutor: req.user._id,
		});

		if (!profile) throw createError(404, "Child profile not found");

		sendResponse(res, 200, true, "Child profile retrieved", profile);
	} catch (err) {
		next(err);
	}
};

/**
 * POST /api/v1/child-profiles
 */
const createChildProfile = async (req, res, next) => {
	try {
		if (req.user.role !== "tutor") {
			throw createError(403, "Only tutors can create child profiles");
		}

		const profile = await ChildProfile.create({
			tutor: req.user._id,
			name: req.body.name,
			age: req.body.age,
			avatarColor: req.body.avatarColor,
			safetyAnchors: req.body.safetyAnchors,
			knownTriggers: req.body.knownTriggers,
			contraindications: req.body.contraindications,
			notes: req.body.notes,
		});

		sendResponse(res, 201, true, "Child profile created", profile);
	} catch (err) {
		next(err);
	}
};

/**
 * PUT /api/v1/child-profiles/:id
 */
const updateChildProfile = async (req, res, next) => {
	try {
		const profile = await ChildProfile.findOne({
			_id: req.params.id,
			tutor: req.user._id,
		});

		if (!profile) throw createError(404, "Child profile not found");

		const allowedFields = [
			"name",
			"age",
			"avatarColor",
			"safetyAnchors",
			"knownTriggers",
			"contraindications",
			"notes",
			"active",
		];

		for (const field of allowedFields) {
			if (req.body[field] !== undefined) {
				profile[field] = req.body[field];
			}
		}

		await profile.save();
		sendResponse(res, 200, true, "Child profile updated", profile);
	} catch (err) {
		next(err);
	}
};

/**
 * DELETE /api/v1/child-profiles/:id
 * Soft-delete (sets active: false).
 */
const deleteChildProfile = async (req, res, next) => {
	try {
		const profile = await ChildProfile.findOne({
			_id: req.params.id,
			tutor: req.user._id,
		});

		if (!profile) throw createError(404, "Child profile not found");

		profile.active = false;
		await profile.save();

		sendResponse(res, 200, true, "Child profile archived");
	} catch (err) {
		next(err);
	}
};

module.exports = {
	getChildProfiles,
	getChildProfileById,
	createChildProfile,
	updateChildProfile,
	deleteChildProfile,
};
