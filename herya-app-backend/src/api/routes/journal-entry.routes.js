const express = require("express");
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
const {
	uploadJournalPhotos,
	uploadJournalVoiceNotes,
	uploadJournalMixed,
} = require("../../middlewares/upload/journal.upload");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// CRUD operations
router.get("/", getJournalEntries); // GET /api/v1/journal-entries
router.post("/", createJournalEntry); // POST /api/v1/journal-entries
router.get("/:id", getJournalEntryById); // GET /api/v1/journal-entries/:id
router.put("/:id", updateJournalEntry); // PUT /api/v1/journal-entries/:id
router.delete("/:id", deleteJournalEntry); // DELETE /api/v1/journal-entries/:id

// =============================
// MEDIA UPLOAD ROUTES
// =============================

// Add photos to journal entry
router.post(
	"/:id/photos",
	uploadJournalPhotos.array("photos", 10),
	(req, _, next) => {
		// Store photo URLs in request for controller
		if (req.files) {
			req.photoUrls = req.files.map((file) => ({
				url: file.path,
				publicId: file.filename,
			}));
		}
		next();
	},
	updateJournalEntry,
); // POST /api/v1/journal-entries/:id/photos (add photos)

// Add voice notes to journal entry
router.post(
	"/:id/voice-notes",
	uploadJournalVoiceNotes.array("voiceNotes", 5),
	(req, _, next) => {
		// Store voice note URLs in request for controller
		if (req.files) {
			req.voiceNoteUrls = req.files.map((file) => ({
				url: file.path,
				duration: 0, // Duration should be calculated or provided by client
				publicId: file.filename,
			}));
		}
		next();
	},
	updateJournalEntry,
); // POST /api/v1/journal-entries/:id/voice-notes (add voice notes)

// Add mixed media (photos + voice notes) to journal entry
router.post(
	"/:id/media",
	uploadJournalMixed.fields([
		{ name: "photos", maxCount: 10 },
		{ name: "voiceNotes", maxCount: 5 },
	]),
	(req, _, next) => {
		// Store mixed media URLs in request for controller
		if (req.files) {
			if (req.files.photos) {
				req.photoUrls = req.files.photos.map((file) => ({
					url: file.path,
					publicId: file.filename,
				}));
			}
			if (req.files.voiceNotes) {
				req.voiceNoteUrls = req.files.voiceNotes.map((file) => ({
					url: file.path,
					duration: 0,
					publicId: file.filename,
				}));
			}
		}
		next();
	},
	updateJournalEntry,
); // POST /api/v1/journal-entries/:id/media (add photos + voice notes)

module.exports = router;
