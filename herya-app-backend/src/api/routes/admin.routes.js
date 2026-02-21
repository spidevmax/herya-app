const {
	getAllPoses,
	postPose,
	updatePose,
	deletePose,
	getAllUsers,
	deleteUser,
} = require("../controllers/admin.controller");
const {
	authenticateToken,
	isAdmin,
} = require("../../middlewares/authorization.middleware");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");

const adminRouter = require("express").Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticateToken, isAdmin);

// POSE Management
adminRouter.get("/poses", asyncErrorWrapper(getAllPoses)); // GET /api/v1/admin/poses
adminRouter.post("/poses", asyncErrorWrapper(postPose)); // POST /api/v1/admin/poses
adminRouter.put("/poses/:id", asyncErrorWrapper(updatePose)); // PUT /api/v1/admin/poses/:id
adminRouter.delete("/poses/:id", asyncErrorWrapper(deletePose)); // DELETE /api/v1/admin/poses/:id

// USER Management
adminRouter.get("/users", asyncErrorWrapper(getAllUsers)); // GET /api/v1/admin/users
adminRouter.delete("/users/:id", asyncErrorWrapper(deleteUser)); // DELETE /api/v1/admin/users/:id

module.exports = adminRouter;
