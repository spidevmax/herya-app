const express = require("express");

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
// RUTAS ADICIONALES
// =============================

posesRouter.get("/search", searchPosesByName); // GET /api/v1/poses/search?name=text
posesRouter.get("/category/:category", getPosesByCategory); // GET /api/v1/poses/category/:category
posesRouter.get("/difficulty/:difficulty", getPosesByDifficulty); // GET /api/v1/poses/difficulty/:difficulty
posesRouter.get("/random", getRandomPose); // GET /api/v1/poses/random
posesRouter.post("/bulk", bulkCreatePoses); // POST /api/v1/poses/bulk

// =============================
// RUTAS CRUD BÁSICAS
// =============================

posesRouter.get("/", getPoses); // GET /api/v1/poses
posesRouter.post("/", postPose); // POST /api/v1/poses
posesRouter.get("/:id", getPoseById); // GET /api/v1/poses/:id
posesRouter.put("/:id", updatePose); // PUT /api/v1/poses/:id
posesRouter.delete("/:id", deletePose); // DELETE /api/v1/poses/:id

module.exports = posesRouter;
