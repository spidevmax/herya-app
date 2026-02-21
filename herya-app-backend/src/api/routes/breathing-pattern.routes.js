const express = require("express");
const {
	authenticateToken,
	isAdmin,
} = require("../../middlewares/authorization.middleware");

const {
	getBreathingPatterns,
	getBreathingPatternById,
} = require("../controllers/breathingPattern.controller");

const {
	postBreathingPattern,
	updateBreathingPattern,
	deleteBreathingPattern,
} = require("../controllers/admin.controller");

const router = express.Router();

// PUBLIC routes - No authentication required
router.get("/", getBreathingPatterns); // GET all breathing patterns
router.get("/:id", getBreathingPatternById); // GET specific breathing pattern

// ADMIN routes - Only admin users
router.post("/", authenticateToken, isAdmin, postBreathingPattern); // Create
router.put("/:id", authenticateToken, isAdmin, updateBreathingPattern); // Update
router.delete("/:id", authenticateToken, isAdmin, deleteBreathingPattern); // Delete

module.exports = router;
