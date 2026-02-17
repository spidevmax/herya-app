const express = require("express");
const { validate } = require("../../middlewares/validation.middleware");

const {
	getSequences,
	getSequenceById,
	createSequence,
	updateSequence,
	deleteSequence,
	getSequencesByLevel,
	getSequencesByStyle,
} = require("../controllers/sequence.controller");

const router = express.Router();

// Filter routes
router.get("/level/:level", getSequencesByLevel);
router.get("/style/:style", getSequencesByStyle);

// CRUD operations
router.get("/", getSequences);
router.post("/", createSequence);
router.get("/:id", getSequenceById);
router.put("/:id", updateSequence);
router.delete("/:id", deleteSequence);

module.exports = router;
