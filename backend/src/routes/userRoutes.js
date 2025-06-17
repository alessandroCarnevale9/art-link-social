const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");

const verifyJWT = require("../middleware/verifyJWT");

router
  .route("/")
  .get(verifyJWT, usersController.getAllUsers)
  .post(usersController.createUser);

router
  .route("/:id")
  .patch(verifyJWT, usersController.updateUser)
  .delete(verifyJWT, usersController.deleteUser);

module.exports = router;
