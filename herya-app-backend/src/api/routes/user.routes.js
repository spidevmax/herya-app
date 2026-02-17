const express = require("express");
const { validate } = require("../../middlewares/validation.middleware");

const { registerUser } = require("../controllers/user.controller");

const router = express.Router();

router.post("/register", registerUser);

module.exports = router;
