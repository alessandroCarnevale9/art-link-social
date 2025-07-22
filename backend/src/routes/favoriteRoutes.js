const express = require("express");
const router = express.Router({ mergeParams: true }); // IMPORTANTE: mergeParams per accedere a :id
const {
  addFavorite,
  removeFavorite,
  getFavorites,
} = require("../controllers/favoritesController");
const authMiddleware = require("../middleware/verifyJWT");
const mapMe = require("../middleware/mapMe");

// Applica l'autenticazione e mapMe a tutte le route nell'ordine corretto
router.use(authMiddleware);
router.use(mapMe);

// Route per i favoriti
// GET /api/users/:id/favorites
router.get("/", getFavorites);

// POST /api/users/:id/favorites/:artworkId
router.post("/:artworkId", addFavorite);

// DELETE /api/users/:id/favorites/:artworkId
router.delete("/:artworkId", removeFavorite);

module.exports = router;
