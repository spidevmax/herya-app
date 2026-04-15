const express = require("express");
const {
	getSessionTemplates,
	getSessionTemplateById,
	createSessionTemplate,
	updateSessionTemplate,
	useSessionTemplate,
	deleteSessionTemplate,
} = require("../controllers/sessionTemplate.controller");
const { authenticateToken } = require("../../middlewares/authorization.middleware");
const { handleValidationErrors } = require("../../middlewares/validation.middleware");
const {
	templateIdValidation,
	createTemplateValidations,
	updateTemplateValidations,
} = require("../validations/sessionTemplate.validations");

const router = express.Router();

router.use(authenticateToken());

router.get("/", getSessionTemplates);
router.get("/:id", templateIdValidation, handleValidationErrors, getSessionTemplateById);
router.post("/", createTemplateValidations, handleValidationErrors, createSessionTemplate);
router.put("/:id", updateTemplateValidations, handleValidationErrors, updateSessionTemplate);
router.post("/:id/use", templateIdValidation, handleValidationErrors, useSessionTemplate);
router.delete("/:id", templateIdValidation, handleValidationErrors, deleteSessionTemplate);

module.exports = router;
