const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { GeneralUser } = require("../models/UserModel");
const Artwork = require("../models/ArtworkModel");

/**
 * POST /api/users/artworks/:id/favorite
 * Adds an artwork to the authenticated user’s favorites
 */
const addFavorite = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const artworkId = req.params.id;

  // Controlla che l'opera esista
  const art = await Artwork.findById(artworkId).lean();
  if (!art) throw new ApiError(404, "Artwork not found.");

  // Aggiunge solo se non è già nei preferiti
  const user = await GeneralUser.findOneAndUpdate(
    { _id: userId, likedArtworks: { $ne: artworkId } },
    { $addToSet: { likedArtworks: artworkId } },
    { new: true }
  );
  if (!user) throw new ApiError(409, "Artwork is already in favorites.");

  res.status(201).json({ message: "Artwork added to favorites." });
});

/**
 * DELETE /api/users/artworks/:id/favorite
 * Removes an artwork from the authenticated user’s favorites
 */
const removeFavorite = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const artworkId = req.params.id;

  // Rimuove solo se era già nei preferiti
  const user = await GeneralUser.findOneAndUpdate(
    { _id: userId, likedArtworks: artworkId },
    { $pull: { likedArtworks: artworkId } },
    { new: true }
  );

  if (!user) {
    // o l'utente non esiste, o quell'artwork non era nei suoi preferiti
    throw new ApiError(404, "Artwork was not in favorites or user not found.");
  }

  res.json({ message: "Artwork removed from favorites." });
});

/**
 * GET /api/users/favorites
 * GET /api/users/favorites/:id
 * Retrieves the list of favorites for the authenticated user or any other user
 */
const getFavorites = asyncHandler(async (req, res) => {
  const targetId = req.params.id || req.userId;
  const user = await GeneralUser.findById(targetId)
    .populate({
      path: "likedArtworks",
      select:
        "title publishDate linkResource medium dimensions origin description",
      populate: [
        { path: "artistId", select: "name" },
        { path: "categories", select: "name" },
      ],
    })
    .lean();
  if (!user) throw new ApiError(404, "User not found.");
  res.json(user.likedArtworks);
});

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
};
