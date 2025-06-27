// src/routes/favoriteRoutes.js
const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const mapMe = require("../middleware/mapMe");
const favCtrl = require("../controllers/favoritesController");

router.use(verifyJWT);

// “Me” endpoint: get my favorites
router.get("/favorites", mapMe, favCtrl.getFavorites);

// Public endpoint: get another user’s favorites
router.get("/favorites/:id", favCtrl.getFavorites);

// Add / remove favorites on artworks
router.post("/artworks/:id/favorite", favCtrl.addFavorite);
router.delete("/artworks/:id/favorite", favCtrl.removeFavorite);

module.exports = router;
