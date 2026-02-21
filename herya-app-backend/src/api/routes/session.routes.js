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

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// CRUD operations
router.get("/", getSessions);
router.post("/", createSession);
router.get("/:id", getSessionById);
router.put("/:id", updateSession);
router.delete("/:id", deleteSession);

module.exports = router;
