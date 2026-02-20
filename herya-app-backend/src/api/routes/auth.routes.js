const { registerUser, loginUser } = require("../controllers/auth.controller");
const { uploadUserImage } = require("../../middlewares/upload/user.upload");
const {
	handleValidationErrors,
} = require("../../middlewares/validation.middleware");
const {
	registerValidations,
	loginValidations,
} = require("../validations/auth.validations");
const authRouter = require("express").Router();

authRouter.post(
	"/register",
	uploadUserImage.single("profileImage"),
	registerValidations,
	handleValidationErrors,
	registerUser,
); // → POST /api/v1/auth/register

authRouter.post("/login", loginValidations, handleValidationErrors, loginUser); // → POST /api/v1/auth/login

module.exports = authRouter;
