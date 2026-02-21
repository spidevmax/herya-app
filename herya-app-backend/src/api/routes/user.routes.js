const {
	getMyProfile,
	updateMyProfile,
	deleteMyAccount,
	changeMyPassword,
} = require("../controllers/user.controller");
const { uploadUserImage } = require("../../middlewares/upload/user.upload");
const {
	authenticateToken,
} = require("../../middlewares/authorization.middleware");
const {
	handleValidationErrors,
} = require("../../middlewares/validation.middleware");
const {
	updateProfileValidations,
	changePasswordValidations,
} = require("../validations/user.validations");

const usersRouter = require("express").Router();

usersRouter.use(authenticateToken);

usersRouter.get("/me", getMyProfile); // → GET /api/v1/users/me

usersRouter.put(
	"/me",
	uploadUserImage.single("profileImage"),
	updateProfileValidations,
	handleValidationErrors,
	updateMyProfile,
); // → PUT /api/v1/users/me

usersRouter.put(
	"/change-password",
	changePasswordValidations,
	handleValidationErrors,
	changeMyPassword,
); // → PUT /api/v1/users/change-password

usersRouter.delete("/me", deleteMyAccount); // → DELETE /api/v1/users/me

module.exports = usersRouter;
