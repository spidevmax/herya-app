const { registerUser, loginUser } = require("../controllers/auth.controller");
const asyncErrorWrapper = require("../../utils/asyncErrorWrapper");
const {
	registerValidations,
	loginValidations,
} = require("../validations/auth.validations");
const {
	handleValidationErrors,
} = require("../../middlewares/validation.middleware");
const { uploadUserImage } = require("../../middlewares/upload/user.upload");

const authRouter = require("express").Router();

/**
 * POST /register
 * @description Register a new user account
 */
authRouter.post(
	"/register",
	uploadUserImage.single("profileImage"),
	registerValidations,
	handleValidationErrors,
	asyncErrorWrapper(registerUser),
);

/**
 * POST /login
 * @description Authenticate user and return JWT token
 */
authRouter.post(
	"/login",
	loginValidations,
	handleValidationErrors,
	asyncErrorWrapper(loginUser),
);

module.exports = authRouter;
