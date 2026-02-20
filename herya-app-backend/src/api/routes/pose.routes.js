const express = require("express");
const {
	authenticateToken,
	isAdmin,
} = require("../../middlewares/authorization.middleware");

const {
	getPoses,
	getPoseById,
	postPose,
	updatePose,
	deletePose,
	searchPosesByName,
	getPosesByCategory,
	getPosesByDifficulty,
	getRandomPose,
	bulkCreatePoses,
} = require("../controllers/pose.controller");

const posesRouter = express.Router();

// =============================
// PUBLIC ROUTES - No authentication required
// =============================

posesRouter.get("/search", searchPosesByName); // GET /api/v1/poses/search?name=text
posesRouter.get("/category/:category", getPosesByCategory); // GET /api/v1/poses/category/:category
posesRouter.get("/difficulty/:difficulty", getPosesByDifficulty); // GET /api/v1/poses/difficulty/:difficulty
posesRouter.get("/random", getRandomPose); // GET /api/v1/poses/random
posesRouter.get("/", getPoses); // GET /api/v1/poses
posesRouter.get("/:id", getPoseById); // GET /api/v1/poses/:id

// =============================
// ADMIN ROUTES - Only admin users can access
// =============================

posesRouter.post("/bulk", authenticateToken(), isAdmin, bulkCreatePoses); // POST /api/v1/poses/bulk
posesRouter.post("/", authenticateToken(), isAdmin, postPose); // POST /api/v1/poses
posesRouter.put("/:id", authenticateToken(), isAdmin, updatePose); // PUT /api/v1/poses/:id
posesRouter.delete("/:id", authenticateToken(), isAdmin, deletePose); // DELETE /api/v1/poses/:id

module.exports = posesRouter;
