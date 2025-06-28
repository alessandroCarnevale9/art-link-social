const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Artwork = require("../models/ArtworkModel");
const Category = require("../models/CategoryModel");
const mongoose = require("mongoose");
const { buildPagination } = require("../utils/queryHelpers");
const {
  lookupArtist,
  lookupCategories,
  addFavoriteCount,
  addCommentsCount,
} = require("../utils/aggregationHelpers");

/**
 * GET /api/artworks
 * – Public
 * – Filters: title, tag, category, artistId, artworkPeriod
 * – Sort: date (createdAt desc), popularity (favoritesCount desc)
 */
const getAllArtworks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = buildPagination(req);
  const {
    title,
    tag,
    category,
    artistId,
    artworkPeriod,
    sortBy = "date",
  } = req.query;

  const match = {};
  if (title) match.title = { $regex: title, $options: "i" };
  if (tag) match.tags = tag;
  if (category) match.categories = mongoose.Types.ObjectId(category);
  if (artistId) match.artistId = mongoose.Types.ObjectId(artistId);
  if (artworkPeriod) match.artworkPeriod = artworkPeriod;

  const pipeline = [
    { $match: match },
    ...lookupArtist(),
    ...lookupCategories(),
    ...addFavoriteCount(),
    { $project: { favorites: 0 } },
    {
      $sort:
        sortBy === "popularity"
          ? { favoritesCount: -1, createdAt: -1 }
          : { createdAt: -1 },
    },
    { $skip: skip },
    { $limit: limit },
  ];

  const [data, total] = await Promise.all([
    Artwork.aggregate(pipeline),
    Artwork.countDocuments(match),
  ]);

  res.json({ total, page, limit, data });
});

/**
 * GET /api/artworks/:id
 * – Public – Detail: metadata, author, artist, categories, commentsCount, favoritesCount
 */
const getArtworkById = asyncHandler(async (req, res) => {
  const artId = mongoose.Types.ObjectId(req.params.id);

  const pipeline = [
    // 1) Seleziona l'opera
    { $match: { _id: artId } },

    // 2) Popola l'autore (inline)
    {
      $lookup: {
        from: "users",
        localField: "authorId",
        foreignField: "_id",
        as: "author",
      },
    },
    { $unwind: "$author" },

    // 3) Popola l'artista e le categorie (helper)
    ...lookupArtist(),
    ...lookupCategories(),

    // 4) Aggiungi contatore commenti e rimuovi l'array
    ...addCommentsCount(),

    // 5) Aggiungi contatore favorites e rimuovi l'array
    ...addFavoriteCount(),

    // 6) Proietta i campi temporanei e nascondi hash, role, isActive, __v di author
    {
      $project: {
        comments: 0,
        favorites: 0,
        "author.passwordHash": 0,
        "author.role": 0,
        "author.isActive": 0,
        "author.__v": 0,
      },
    },
  ];

  const [result] = await Artwork.aggregate(pipeline);
  if (!result) {
    throw new ApiError(404, "Artwork not found.");
  }

  res.json(result);
});

/**
 * POST /api/artworks
 * – Admin: any origin & authorId defaults to req.userId if not provided
 * – General: origin=UserUploaded & authorId=req.userId
 */
const createArtwork = asyncHandler(async (req, res) => {
  const meId = req.userId;
  const meRole = req.userRole;

  const {
    title,
    publishDate,
    artworkPeriod,
    artworkCulture,
    linkResource,
    medium,
    dimensions,
    origin: bodyOrigin,
    authorId: bodyAuthorId,
    artistId,
    tags,
    categories,
    description,
  } = req.body;

  if (!title?.trim()) {
    throw new ApiError(400, "Title is required.");
  }

  // Determino authorId e origin in base al ruolo
  let authorId;
  let origin;
  if (meRole === "general") {
    authorId = meId;
    origin = "UserUploaded";
  } else if (meRole === "admin") {
    authorId = bodyAuthorId || meId;
    // Se bodyOrigin è uno dei due valori consentiti, lo uso, altrimenti default
    origin = ["AdminUploaded", "UserUploaded"].includes(bodyOrigin)
      ? bodyOrigin
      : "AdminUploaded";
  } else {
    throw new ApiError(403, "Forbidden");
  }

  // Validazione categorie (se presenti)
  if (categories?.length) {
    const valid = await Category.countDocuments({ _id: { $in: categories } });
    if (valid !== categories.length) {
      throw new ApiError(400, "One or more categories are invalid.");
    }
  }

  const artwork = await Artwork.create({
    title: title.trim(),
    publishDate,
    artworkPeriod,
    artworkCulture,
    linkResource,
    medium,
    dimensions,
    origin,
    authorId,
    artistId,
    tags,
    categories,
    description,
  });

  res.status(201).json({ message: "Artwork created.", artwork });
});

/**
 * PATCH /api/artworks/:id
 * – Admin: can edit any
 * – General: only own uploads
 */
const updateArtwork = asyncHandler(async (req, res) => {
  const art = await Artwork.findById(req.params.id);
  if (!art) throw new ApiError(404, "Artwork not found.");

  const meId = req.userId;
  const meRole = req.userRole;

  if (meRole === "general") {
    if (art.origin !== "UserUploaded" || art.authorId.toString() !== meId) {
      throw new ApiError(403, "You can only edit your own uploads.");
    }
  } else if (meRole !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  const update = {};
  for (const field of [
    "title",
    "publishDate",
    "artworkPeriod",
    "artworkCulture",
    "linkResource",
    "medium",
    "dimensions",
    "origin",
    "artistId",
    "tags",
    "description",
  ]) {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  }
  if (req.body.categories) {
    const cats = req.body.categories;
    const valid = await Category.countDocuments({ _id: { $in: cats } });
    if (valid !== cats.length) throw new ApiError(400, "Invalid categories.");
    update.categories = cats;
  }

  const updated = await Artwork.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).lean();

  res.json({ message: "Artwork updated.", artwork: updated });
});

/**
 * DELETE /api/artworks/:id
 * – Admin: any
 * – General: only own uploads
 */
const deleteArtwork = asyncHandler(async (req, res) => {
  const art = await Artwork.findById(req.params.id);
  if (!art) throw new ApiError(404, "Artwork not found.");

  const meId = req.userId;
  const meRole = req.userRole;

  if (meRole === "general") {
    if (art.origin !== "UserUploaded" || art.authorId.toString() !== meId) {
      throw new ApiError(403, "You can only delete your own uploads.");
    }
  } else if (meRole !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  await art.deleteOne();
  res.json({ message: "Artwork deleted." });
});

module.exports = {
  getAllArtworks,
  getArtworkById,
  createArtwork,
  updateArtwork,
  deleteArtwork,
};
