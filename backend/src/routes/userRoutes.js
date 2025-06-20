const express = require("express");
const router = express.Router();
const usersCtrl = require("../controllers/usersController");
const verifyJWT = require("../middleware/verifyJWT");
const {
  validateUser,
  validateUserUpdate,
} = require("../middleware/userValidation");

router.post("/register", validateUser, usersCtrl.createUser);

router.route("/").get(verifyJWT, usersCtrl.getAllUsers); // solo admin

router
  .route("/:id")
  .patch(verifyJWT, validateUserUpdate, usersCtrl.updateUser)
  .delete(verifyJWT, usersCtrl.deleteUser);

module.exports = router;
