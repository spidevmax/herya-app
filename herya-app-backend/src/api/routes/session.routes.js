const express = require("express");
const {
	getSessions,
	getSessionById,
	createSession,
	updateSession,
	deleteSession,
} = require("../controllers/session.controller");
const {
	authenticateToken,
} = require("../../middlewares/authorization.middleware");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// CRUD operations
router.get("/", asyncErrorWrapper(getSessions));
router.post("/", asyncErrorWrapper(createSession));
router.get("/:id", asyncErrorWrapper(getSessionById));
router.put("/:id", asyncErrorWrapper(updateSession));
router.delete("/:id", asyncErrorWrapper(deleteSession));

module.exports = router;
