const express = require("express");
const router = express.Router();
const usersCtrl = require("../controllers/usersController");
const verifyJWT = require("../middleware/verifyJWT");
const {
  validateUser,
  validateUserUpdate,
} = require("../middleware/userValidation");

// Registrazione aperta a tutti
router.post("/register", validateUser, usersCtrl.createUser);

// Visualizza profilo personale: usa l’ID dal payload del JWT
router.get(
  "/me",
  verifyJWT,
  // middleware che mappa l’id dell’utente loggato in req.params.id
  (req, res, next) => {
    req.params.id = req.userId;
    next();
  },
  usersCtrl.getUser
);

// Modifica profilo personale: usa l’ID dal payload del JWT
router.patch(
  "/me",
  verifyJWT,
  validateUserUpdate,
  // middleware che mappa l’id dell’utente loggato in req.params.id
  (req, res, next) => {
    req.params.id = req.userId;
    next();
  },
  usersCtrl.updateUser
);

// Visualizza lista completa di tutti gli utenti (solo admin)
router.get("/", verifyJWT, usersCtrl.getAllUsers);

// CRUD su user singolo
router
  .route("/:id")
  .get(verifyJWT, usersCtrl.getUser)
  .patch(verifyJWT, validateUserUpdate, usersCtrl.updateUser)
  .delete(verifyJWT, usersCtrl.deleteUser);

module.exports = router;
