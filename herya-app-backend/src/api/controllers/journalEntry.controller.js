const JournalEntry = require("../models/JournalEntry.model");

/**
 * GET /api/v1/journal-entries/
 * - Fetches all journal entries for the authenticated user.
 * - If successful, responds 200 with the array of journal entries.
 */
const getJournalEntries = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const entries = await JournalEntry.find({ user: userId })
			.populate("session")
			.populate("user", "name email")
			.sort({ createdAt: -1 });
		res.status(200).json(entries);
	} catch (error) {
		return next(error);
	}
};

/**
 * GET /api/v1/journal-entries/:id
 * - Finds a journal entry by ID.
 * - If not found, returns 404.
 * - If ID format is invalid, returns 400.
 */
const getJournalEntryById = async (req, res, next) => {
	try {
		const entry = await JournalEntry.findById(req.params.id)
			.populate("session")
			.populate("user", "name email");
		if (!entry) {
			return res.status(404).json({ error: "Journal entry not found" });
		}
		res.status(200).json(entry);
	} catch (error) {
		return next(error);
	}
};

/**
 * POST /api/v1/journal-entries/
 * - Creates a new journal entry.
 * - Applies Schema validations automatically.
 * - If creation is successful, returns 201 with the created document.
 */
const createJournalEntry = async (req, res, next) => {
	try {
		const userId = req.user.id;
		const entryData = {
			...req.body,
			user: userId,
		};
		const entry = await JournalEntry.create(entryData);
		const populatedEntry = await entry.populate([
			"session",
			{ path: "user", select: "name email" },
		]);
		res.status(201).json(populatedEntry);
	} catch (error) {
		return next(error);
	}
};

/**
 * PUT /api/v1/journal-entries/:id
 * - Updates an existing journal entry.
 * - { new: true } returns the updated document.
 * - { runValidators: true } respects Schema validations.
 * - If not found, 404. If successful, 200.
 */
const updateJournalEntry = async (req, res, next) => {
	try {
		const updated = await JournalEntry.findByIdAndUpdate(
			req.params.id,
			req.body,
			{
				new: true,
				runValidators: true,
			},
		)
			.populate("session")
			.populate("user", "name email");
		if (!updated) {
			return res.status(404).json({ error: "Journal entry not found" });
		}
		res.status(200).json(updated);
	} catch (error) {
		return next(error);
	}
};

/**
 * DELETE /api/v1/journal-entries/:id
 * - Deletes a journal entry by ID.
 * - If not found, 404. If deleted, 200 with confirmation message.
 */
const deleteJournalEntry = async (req, res, next) => {
	try {
		const deleted = await JournalEntry.findByIdAndDelete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: "Journal entry not found" });
		}
		res.status(200).json({ message: "Journal entry deleted successfully" });
	} catch (error) {
		return next(error);
	}
};

module.exports = {
	getJournalEntries,
	getJournalEntryById,
	createJournalEntry,
	updateJournalEntry,
	deleteJournalEntry,
};
