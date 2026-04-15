const express = require("express");
const {
	getChildProfiles,
	getChildProfileById,
	createChildProfile,
	updateChildProfile,
	deleteChildProfile,
} = require("../controllers/childProfile.controller");
const { authenticateToken } = require("../../middlewares/authorization.middleware");
const { handleValidationErrors } = require("../../middlewares/validation.middleware");
const {
	childProfileIdValidation,
	createChildProfileValidations,
	updateChildProfileValidations,
} = require("../validations/childProfile.validations");

const router = express.Router();

// All routes require authentication (tutor role enforced in controller)
router.use(authenticateToken());

router.get("/", getChildProfiles);
router.get("/:id", childProfileIdValidation, handleValidationErrors, getChildProfileById);
router.post("/", createChildProfileValidations, handleValidationErrors, createChildProfile);
router.put("/:id", updateChildProfileValidations, handleValidationErrors, updateChildProfile);
router.delete("/:id", childProfileIdValidation, handleValidationErrors, deleteChildProfile);

module.exports = router;
