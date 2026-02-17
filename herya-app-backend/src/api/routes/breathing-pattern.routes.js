const express = require("express");
const {
	getBreathingPatterns,
	getBreathingPatternById,
	createBreathingPattern,
	updateBreathingPattern,
	deleteBreathingPattern,
} = require("../controllers/breathingPattern.controller");

const router = express.Router();

// CRUD operations
router.get("/", getBreathingPatterns);
router.post("/", createBreathingPattern);
router.get("/:id", getBreathingPatternById);
router.put("/:id", updateBreathingPattern);
router.delete("/:id", deleteBreathingPattern);

module.exports = router;
