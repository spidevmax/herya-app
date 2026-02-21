const express = require("express");
const {
	authenticateToken,
} = require("../../middlewares/authorization.middleware");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");

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
router.get(
	"/difficulty/:difficulty",
	asyncErrorWrapper(getSequencesByDifficulty),
);
router.get("/style/:style", asyncErrorWrapper(getSequencesByStyle));
router.get("/", asyncErrorWrapper(getSequences));
router.get("/:id", asyncErrorWrapper(getSequenceById));

// Authenticated routes
router.post("/", authenticateToken, asyncErrorWrapper(createSequence));
router.put("/:id", authenticateToken, asyncErrorWrapper(updateSequence));
router.delete("/:id", authenticateToken, asyncErrorWrapper(deleteSequence));

module.exports = router;
