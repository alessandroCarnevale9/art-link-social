const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Artwork = require("../models/ArtworkModel");
const Favorite = require("../models/FavoriteModel");

/**
 * POST /api/users/:id/favorites/:artworkId
 * Aggiunge un artwork ai preferiti dell'utente autenticato
 */
const addFavorite = asyncHandler(async (req, res) => {
  // Gestisci "me" e fallback al middleware mapMe
  const userId = req.params.id === "me" ? req.userId : req.params.id;
  const artworkId = req.params.artworkId;

  console.log(
    "addFavorite - raw params.id:",
    req.params.id,
    "resolved userId:",
    userId,
    "artworkId:",
    artworkId
  );

  // 1) Verifica che l'opera esista
  const artExists = await Artwork.exists({ _id: artworkId });
  if (!artExists) throw new ApiError(404, "Artwork not found.");

  // 2) Crea il Favorite (indice unico evita duplicati)
  try {
    await Favorite.create({ user: userId, artwork: artworkId });
  } catch (e) {
    if (e.code === 11000) {
      throw new ApiError(409, "Artwork is already in favorites.");
    }
    throw e;
  }

  // 3) Incrementa il contatore in modo atomico
  const art = await Artwork.findByIdAndUpdate(
    artworkId,
    { $inc: { favoritesCount: 1 } },
    { new: true }
  );

  res.status(201).json({
    message: "Artwork added to favorites.",
    favoritesCount: art.favoritesCount,
  });
});

/**
 * DELETE /api/users/:id/favorites/:artworkId
 * Rimuove un artwork dai preferiti dell'utente
 */
const removeFavorite = asyncHandler(async (req, res) => {
  // Gestisci "me" e fallback al middleware mapMe
  const userId = req.params.id === "me" ? req.userId : req.params.id;
  const artworkId = req.params.artworkId;

  console.log(
    "removeFavorite - raw params.id:",
    req.params.id,
    "resolved userId:",
    userId,
    "artworkId:",
    artworkId
  );

  // 1) Elimina il Favorite
  const deleted = await Favorite.findOneAndDelete({
    user: userId,
    artwork: artworkId,
  });

  if (!deleted) throw new ApiError(404, "Favorite not found.");

  // 2) Decrementa il contatore (atomic pipeline) e recupera il doc aggiornato
  const art = await Artwork.findByIdAndUpdate(
    artworkId,
    [
      {
        $set: {
          favoritesCount: { $max: [{ $subtract: ["$favoritesCount", 1] }, 0] },
        },
      },
    ],
    { new: true }
  );

  // 3) Rispondi con il nuovo favoritesCount
  res.json({ favoritesCount: art.favoritesCount });
});

/**
 * GET /api/users/:id/favorites
 * Restituisce la lista dei preferiti di un utente (me o altro)
 */
const getFavorites = asyncHandler(async (req, res) => {
  // Gestisci "me" e fallback al middleware mapMe
  const userId = req.params.id === "me" ? req.userId : req.params.id;

  console.log(
    "getFavorites - raw params.id:",
    req.params.id,
    "resolved userId:",
    userId
  );

  // 1) Trova tutti i Favorite e popola l'artwork
  const favs = await Favorite.find({ user: userId })
    .populate({
      path: "artwork",
      select:
        "externalId title publishDate linkResource medium dimensions origin description favoritesCount",
      populate: [
        { path: "artistId", select: "displayName" },
        { path: "categories", select: "name" },
      ],
    })
    .lean();

  // 2) Restituisce solo la parte artwork
  const artworks = favs.map((f) => f.artwork);
  res.json(artworks);
});

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites,
};
