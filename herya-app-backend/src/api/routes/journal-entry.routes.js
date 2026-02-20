const express = require("express");
const { validate } = require("../../middlewares/validation.middleware");
const {
	getJournalEntries,
	getJournalEntryById,
	createJournalEntry,
	updateJournalEntry,
	deleteJournalEntry,
} = require("../controllers/journalEntry.controller");
const {
	authenticateToken,
} = require("../../middlewares/authorization.middleware");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// CRUD operations
router.get("/", getJournalEntries);
router.post("/", createJournalEntry);
router.get("/:id", getJournalEntryById);
router.put("/:id", updateJournalEntry);
router.delete("/:id", deleteJournalEntry);

module.exports = router;
