const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Artwork = require("../models/ArtworkModel");
const Category = require("../models/CategoryModel");

/**
 * GET /api/artworks
 * – Pubblico (guest o autenticato)
 * – Filtri: title (keyword), tag, category, artistId, artworkPeriod
 * – Ordinamento: relevance (default = createdAt desc), date (createdAt), popularity (favoritesCount)
 */
const getAllArtworks = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const {
    title,
    tag,
    category,
    artistId,
    artworkPeriod,
    sortBy = "date", // “date” | “popularity”
  } = req.query;

  const filter = {};
  if (title) filter.title = new RegExp(title, "i");
  if (tag) filter.tags = tag;
  if (category) filter.categories = category;
  if (artistId) filter.artistId = artistId;
  if (artworkPeriod) filter.artworkPeriod = artworkPeriod;

  // costruisco l'ordinamento
  let sort = { createdAt: -1 };
  if (sortBy === "popularity") {
    // presuppone che favoritesCount sia un campo aggiornato altrove
    sort = { favoritesCount: -1, createdAt: -1 };
  }

  const [total, data] = await Promise.all([
    Artwork.countDocuments(filter),
    Artwork.find(filter)
      .populate("artistId", "name")
      .populate("categories", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  res.json({ total, page, limit, data });
});

/**
 * GET /api/artworks/:id
 * – Pubblico
 * – Dettaglio completo: metadata, author, artist, categories, commentsCount, favoritesCount
 */
const getArtworkById = asyncHandler(async (req, res) => {
  const art = await Artwork.findById(req.params.id)
    .populate("artistId", "name bio")
    .populate("authorId", "firstName lastName profileImage")
    .populate("categories", "name")
    .lean();
  if (!art) throw new ApiError(404, "Artwork not found.");

  // Aggiungo contatori (presupponendo esistano campi o virtuals)
  art.commentsCount = art.comments?.length || 0;
  art.favoritesCount = art.favorites?.length || 0;

  res.json(art);
});

/**
 * POST /api/artworks
 * – Admin può creare qualunque opera (origin = AdminUploaded o UserUploaded)
 * – General user può creare solo origin = UserUploaded e authorId = se stesso
 */
const createArtwork = asyncHandler(async (req, res) => {
  const {
    title,
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
  } = req.body;

  if (!title?.trim()) throw new ApiError(400, "Title is required.");

  // gestione permessi
  if (req.userRole === "general") {
    // general user deve avere origin = UserUploaded e authorId = req.userId
    if (origin !== "UserUploaded" || authorId !== req.userId) {
      throw new ApiError(403, "You can only upload your own artworks.");
    }
  } else if (req.userRole !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  // verifica categorie esistenti
  if (categories?.length) {
    const count = await Category.countDocuments({ _id: { $in: categories } });
    if (count !== categories.length) {
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
 * – Admin può modificare qualsiasi opera
 * – General user può modificare solo le proprie opere (origin = UserUploaded & authorId = se stesso)
 */
const updateArtwork = asyncHandler(async (req, res) => {
  const art = await Artwork.findById(req.params.id);
  if (!art) throw new ApiError(404, "Artwork not found.");

  if (req.userRole === "general") {
    if (
      art.origin !== "UserUploaded" ||
      art.authorId.toString() !== req.userId
    ) {
      throw new ApiError(403, "You can only edit your own uploads.");
    }
  } else if (req.userRole !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  const update = {};
  for (const f of [
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
    if (req.body[f] !== undefined) update[f] = req.body[f];
  }
  if (req.body.categories) {
    const cats = req.body.categories;
    const count = await Category.countDocuments({ _id: { $in: cats } });
    if (count !== cats.length) throw new ApiError(400, "Invalid categories.");
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
 * – Admin può eliminare qualsiasi opera
 * – General user può eliminare solo le proprie opere (UserUploaded)
 */
const deleteArtwork = asyncHandler(async (req, res) => {
  const art = await Artwork.findById(req.params.id);
  if (!art) throw new ApiError(404, "Artwork not found.");

  if (req.userRole === "general") {
    if (
      art.origin !== "UserUploaded" ||
      art.authorId.toString() !== req.userId
    ) {
      throw new ApiError(403, "You can only delete your own uploads.");
    }
  } else if (req.userRole !== "admin") {
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
