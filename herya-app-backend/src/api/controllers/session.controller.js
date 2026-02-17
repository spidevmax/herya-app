const Session = require("../models/Session.model");

/**
 * GET /api/v1/sessions/
 * - Fetches all sessions for the authenticated user.
 * - If successful, responds 200 with the array of sessions.
 */
const getSessions = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const sessions = await Session.find({ user: userId })
			.populate("user", "name email")
			.populate("sequence")
			.populate("poses.pose")
			.populate("breathingPattern")
			.sort({ createdAt: -1 });
		res.status(200).json(sessions);
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/sessions/:id
 * - Finds a session by ID.
 * - If not found, returns 404.
 * - If ID format is invalid, returns 400.
 */
const getSessionById = async (req, res, next) => {
	try {
		const session = await Session.findById(req.params.id)
			.populate("user", "name email")
			.populate("sequence")
			.populate("poses.pose")
			.populate("breathingPattern");
		if (!session) {
			return res.status(404).json({ error: "Session not found" });
		}
		res.status(200).json(session);
	} catch (error) {
		return next(error);
	}
};

/**
 * POST /api/v1/sessions/
 * - Creates a new session.
 * - Applies Schema validations automatically.
 * - If creation is successful, returns 201 with the created document.
 */
const createSession = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const sessionData = {
			...req.body,
			user: userId,
		};
		const session = await Session.create(sessionData);
		const populatedSession = await session.populate([
			"user",
			"sequence",
			"poses.pose",
			"breathingPattern",
		]);
		res.status(201).json(populatedSession);
	} catch (error) {
		return next(error);
	}
};

/**
 * PUT /api/v1/sessions/:id
 * - Updates an existing session.
 * - { new: true } returns the updated document.
 * - { runValidators: true } respects Schema validations.
 * - If not found, 404. If successful, 200.
 */
const updateSession = async (req, res, next) => {
	try {
		const updated = await Session.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		})
			.populate("user", "name email")
			.populate("sequence")
			.populate("poses.pose")
			.populate("breathingPattern");
		if (!updated) {
			return res.status(404).json({ error: "Session not found" });
		}
		res.status(200).json(updated);
	} catch (error) {
		return next(error);
	}
};

/**
 * DELETE /api/v1/sessions/:id
 * - Deletes a session by ID.
 * - If not found, 404. If deleted, 200 with confirmation message.
 */
const deleteSession = async (req, res, next) => {
	try {
		const deleted = await Session.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: "Session not found" });
		}
		res.status(200).json({ message: "Session deleted successfully" });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getSessions,
	getSessionById,
	createSession,
	updateSession,
	deleteSession,
};
