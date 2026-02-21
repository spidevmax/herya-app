const express = require("express");
const {
	authenticateToken,
	isAdmin,
} = require("../../middlewares/authorization.middleware");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");

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
router.get("/", asyncErrorWrapper(getBreathingPatterns)); // GET all breathing patterns
router.get("/:id", asyncErrorWrapper(getBreathingPatternById)); // GET specific breathing pattern

// ADMIN routes - Only admin users
router.post(
	"/",
	authenticateToken,
	isAdmin,
	asyncErrorWrapper(postBreathingPattern),
); // Create
router.put(
	"/:id",
	authenticateToken,
	isAdmin,
	asyncErrorWrapper(updateBreathingPattern),
); // Update
router.delete(
	"/:id",
	authenticateToken,
	isAdmin,
	asyncErrorWrapper(deleteBreathingPattern),
); // Delete

module.exports = router;
