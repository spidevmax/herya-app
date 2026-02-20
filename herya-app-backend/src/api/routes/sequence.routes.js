const express = require("express");
const { validate } = require("../../middlewares/validation.middleware");
const {
	authenticateToken,
} = require("../../middlewares/authorization.middleware");

const {
	getSequences,
	getSequenceById,
	createSequence,
	updateSequence,
	deleteSequence,
	getSequencesByDifficulty,
	getSequencesByStyle,
} = require("../controllers/sequence.controller");

const router = express.Router();

// Public routes
router.get("/difficulty/:difficulty", getSequencesByDifficulty);
router.get("/style/:style", getSequencesByStyle);
router.get("/", getSequences);
router.get("/:id", getSequenceById);

// Authenticated routes
router.post("/", authenticateToken(), createSequence);
router.put("/:id", authenticateToken(), updateSequence);
router.delete("/:id", authenticateToken(), deleteSequence);

module.exports = router;
