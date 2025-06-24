const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const loginLimiter = require("../middleware/loginLimiter");
const { validateUser, validateUserLogIn } = require("../middleware/userValidation");

router.post(
  "/login",
  validateUserLogIn,
  loginLimiter,
  authController.login
);

router.get("/refresh", authController.refresh);
router.post("/logout", authController.logout);

module.exports = router;
