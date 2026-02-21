const express = require("express");
const {
	authenticateToken,
	isAdmin,
} = require("../../middlewares/authorization.middleware");
const {
	uploadPoseThumbnail,
	uploadPoseImages,
	uploadPoseVideos,
} = require("../../middlewares/upload/pose.upload");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");

const {
	getPoses,
	getPoseById,
	searchPosesByName,
	getPosesByCategory,
	getPosesByDifficulty,
	getRandomPose,
} = require("../controllers/pose.controller");

const {
	postPose,
	updatePose,
	deletePose,
} = require("../controllers/admin.controller");

const posesRouter = express.Router();

// =============================
// PUBLIC ROUTES - No authentication required
// =============================

posesRouter.get("/search", asyncErrorWrapper(searchPosesByName)); // GET /api/v1/poses/search?name=text
posesRouter.get("/category/:category", asyncErrorWrapper(getPosesByCategory)); // GET /api/v1/poses/category/:category
posesRouter.get(
	"/difficulty/:difficulty",
	asyncErrorWrapper(getPosesByDifficulty),
); // GET /api/v1/poses/difficulty/:difficulty
posesRouter.get("/random", asyncErrorWrapper(getRandomPose)); // GET /api/v1/poses/random
posesRouter.get("/", asyncErrorWrapper(getPoses)); // GET /api/v1/poses
posesRouter.get("/:id", asyncErrorWrapper(getPoseById)); // GET /api/v1/poses/:id

// =============================
// ADMIN ROUTES - Only admin users can access
// =============================

posesRouter.post(
	"/",
	authenticateToken,
	isAdmin,
	uploadPoseThumbnail.single("thumbnail"),
	asyncErrorWrapper(postPose),
); // POST /api/v1/poses (with optional thumbnail)

posesRouter.put(
	"/:id",
	authenticateToken,
	isAdmin,
	uploadPoseThumbnail.single("thumbnail"),
	asyncErrorWrapper(updatePose),
); // PUT /api/v1/poses/:id (with optional thumbnail update)

posesRouter.post(
	"/:id/images",
	authenticateToken,
	isAdmin,
	uploadPoseImages.array("images", 10),
	(req, _, next) => {
		// Store image URLs in request for controller
		if (req.files) {
			req.imageUrls = req.files.map((file) => ({
				url: file.path,
				publicId: file.filename,
			}));
		}
		next();
	},
	asyncErrorWrapper(updatePose),
); // POST /api/v1/poses/:id/images (add multiple images)

posesRouter.post(
	"/:id/videos",
	authenticateToken,
	isAdmin,
	uploadPoseVideos.array("videos", 5),
	(req, _, next) => {
		// Store video URLs in request for controller
		if (req.files) {
			req.videoUrls = req.files.map((file) => ({
				url: file.path,
				publicId: file.filename,
			}));
		}
		next();
	},
	asyncErrorWrapper(updatePose),
); // POST /api/v1/poses/:id/videos (add multiple videos)

posesRouter.delete(
	"/:id",
	authenticateToken,
	isAdmin,
	asyncErrorWrapper(deletePose),
); // DELETE /api/v1/poses/:id

module.exports = posesRouter;
