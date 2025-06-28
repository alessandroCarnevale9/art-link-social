const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { GeneralUser } = require("../models/UserModel");
const Artwork = require("../models/ArtworkModel");
const Favorite = require("../models/FavoriteModel");

/**
 * POST /api/users/:id/favorites/:artworkId
 * Adds an artwork to the authenticated user’s favorites
 */
const addFavorite = asyncHandler(async (req, res) => {
  const userId = req.params.id === "me" ? req.userId : req.params.id;
  const artworkId = req.params.artworkId;

  // Controlla che l'opera esista
  const artExists = await Artwork.exists({ _id: artworkId });
  if (!artExists) throw new ApiError(404, "Artwork not found.");

  // Crea un nuovo documento Favorite; l'indice unico previene duplicati
  try {
    await Favorite.create({ user: userId, artwork: artworkId });
  } catch (e) {
    if (e.code === 11000) {
      // Duplicate key error
      throw new ApiError(409, "Artwork is already in favorites.");
    }
    throw e;
  }

  res.status(201).json({ message: "Artwork added to favorites." });
});

/**
 * DELETE /api/users/:id/favorites/:artworkId
 * Removes an artwork from the authenticated user’s favorites
 */
const removeFavorite = asyncHandler(async (req, res) => {
  const userId = req.params.id === "me" ? req.userId : req.params.id;
  const artworkId = req.params.artworkId;

  const result = await Favorite.findOneAndDelete({
    user: userId,
    artwork: artworkId,
  });

  if (!result) {
    throw new ApiError(404, "Favorite not found.");
  }

  res.status(204).send();
});

/**
 * GET /api/users/:id/favorites
 * Retrieves the list of favorites for the authenticated user or any other user
 */
const getFavorites = asyncHandler(async (req, res) => {
  const userId = req.params.id === "me" ? req.userId : req.params.id;

  // Trova tutti i Favorite di questo utente e popola l'artwork
  const favs = await Favorite.find({ user: userId })
    .populate({
      path: "artwork",
      select:
        "title publishDate linkResource medium dimensions origin description",
      populate: [
        { path: "artistId", select: "displayName" },
        { path: "categories", select: "name" },
      ],
    })
    .lean();

  // Restituisci solo gli artwork
  res.json(favs.map((f) => f.artwork));
});

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
};
