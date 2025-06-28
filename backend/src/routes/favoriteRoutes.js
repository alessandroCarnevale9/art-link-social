const express = require("express");
const router = express.Router({ mergeParams: true });
const verifyJWT = require("../middleware/verifyJWT");
const mapMe = require("../middleware/mapMe");
const ctrl = require("../controllers/favoritesController");

// Proteggi tutte le rotte
router.use(verifyJWT);
router.use(mapMe);

// GET    /api/users/:id/favorites
router.get("/favorites", ctrl.getFavorites);

// POST   /api/users/:id/favorites/:artworkId
router.post("/favorites/:artworkId", ctrl.addFavorite);
// DELETE /api/users/:id/favorites/:artworkId
router.delete("/favorites/:artworkId", ctrl.removeFavorite);

module.exports = router;
