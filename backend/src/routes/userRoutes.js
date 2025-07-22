const express = require("express");
const router = express.Router();
const usersCtrl = require("../controllers/usersController");
const verifyJWT = require("../middleware/verifyJWT");
const {
  validateUser,
  validateUserUpdate,
} = require("../middleware/userValidation");

const upload = require("../middleware/multer");
const mapMe = require("../middleware/mapMe");

const followRoutes = require("./followRoutes");
const favoriteRoutes = require("./favoriteRoutes");

// Registrazione aperta a tutti
router.post("/register", validateUser, usersCtrl.createUser);

// Visualizza profilo personale: usa l’ID dal payload del JWT
router.get("/me", verifyJWT, mapMe, usersCtrl.getUser);

// Modifica profilo personale: usa l’ID dal payload del JWT
router.patch(
  "/me",
  verifyJWT,
  validateUserUpdate,
  upload.single("profilePicture"),
  mapMe,
  usersCtrl.updateUser
);

// Visualizza lista completa di tutti gli utenti (solo admin)
router.get("/", verifyJWT, usersCtrl.getAllUsers);

// CRUD su user singolo
router
  .route("/:id")
  .get(verifyJWT, usersCtrl.getUser)
  .patch(
    verifyJWT,
    validateUserUpdate,
    upload.single("profilePicture"),
    usersCtrl.updateUser
  )
  .delete(verifyJWT, usersCtrl.deleteUser);

router.use("/:id", followRoutes);
router.use("/:id", favoriteRoutes);

module.exports = router;
