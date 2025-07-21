// backend/src/controllers/metController.js
const asyncHandler = require("express-async-handler");
const { getOrCreateMetArtwork } = require("../services/metService");
const ApiError = require("../utils/ApiError");

exports.importMetArtwork = asyncHandler(async (req, res) => {
  // Assicuriamoci che l’utente sia autenticato
  const authorId = req.userId;
  if (!authorId) throw new ApiError(401, "Authentication required");

  const externalId = parseInt(req.params.id, 10);
  if (isNaN(externalId)) throw new ApiError(400, "Invalid ID");

  const artwork = await getOrCreateMetArtwork(externalId, authorId);
  res.json({ artwork });
});
