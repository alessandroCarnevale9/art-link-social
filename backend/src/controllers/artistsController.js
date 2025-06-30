const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Artist = require("../models/ArtistModel");

// GET /api/artists
// Public
const getAllArtists = asyncHandler(async (req, res) => {
  const artists = await Artist.find().lean();
  res.json(artists);
});

// GET /api/artists/:id
// Public
const getArtistById = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id).lean();
  if (!artist) {
    throw new ApiError(404, "Artist not found");
  }
  res.json(artist);
});

// POST /api/artists
// Admin
const createArtist = asyncHandler(async (req, res) => {
  const {
    displayName,
    displayBio,
    birthDate,
    deathDate,
    nationality,
    wikiUrl,
  } = req.body;
  if (!displayName) {
    throw new ApiError(400, "displayName is required");
  }
  const artist = await Artist.create({
    displayName,
    displayBio,
    birthDate,
    deathDate,
    nationality,
    wikiUrl,
  });
  res.status(201).json(artist);
});

// PATCH /api/artists/:id
// Admin
const updateArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id);
  if (!artist) {
    throw new ApiError(404, "Artist not found");
  }
  [
    "displayName",
    "displayBio",
    "birthDate",
    "deathDate",
    "nationality",
    "wikiUrl",
  ].forEach((field) => {
    if (req.body[field] !== undefined) artist[field] = req.body[field];
  });
  const updated = await artist.save();
  res.json(updated);
});

// DELETE /api/artists/:id
// Admin
const deleteArtist = asyncHandler(async (req, res) => {
  const artist = await Artist.findById(req.params.id);
  if (!artist) {
    throw new ApiError(404, "Artist not found");
  }
  await artist.deleteOne();
  res.json({ message: "Artist removed" });
});

module.exports = {
  getAllArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
};
