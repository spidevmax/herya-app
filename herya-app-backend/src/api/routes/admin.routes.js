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

const adminRouter = require("express").Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticateToken(), isAdmin);

// POSE Management
adminRouter.get("/poses", getAllPoses); // GET /api/v1/admin/poses
adminRouter.post("/poses", postPose); // POST /api/v1/admin/poses
adminRouter.put("/poses/:id", updatePose); // PUT /api/v1/admin/poses/:id
adminRouter.delete("/poses/:id", deletePose); // DELETE /api/v1/admin/poses/:id

// USER Management
adminRouter.get("/users", getAllUsers); // GET /api/v1/admin/users
adminRouter.delete("/users/:id", deleteUser); // DELETE /api/v1/admin/users/:id

module.exports = adminRouter;
