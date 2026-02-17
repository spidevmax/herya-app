const express = require("express");
const {
	login,
	logout,
	verifyToken,
} = require("../controllers/auth.controller");
const { authenticateToken } = require("../../middlewares/auth.middleware");

const router = express.Router();

// Public routes
router.post("/login", login);

// Protected routes
router.post("/logout", authenticateToken, logout);
router.get("/verify", authenticateToken, verifyToken);

module.exports = router;
