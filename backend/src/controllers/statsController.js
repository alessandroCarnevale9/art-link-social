const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { User } = require("../models/UserModel");
const Artwork = require("../models/ArtworkModel");
const Comment = require("../models/CommentModel");
const Report = require("../models/ReportModel");
const Favorite = require("../models/FavoriteModel"); // ← nuovo
const mongoose = require("mongoose");

const getStats = asyncHandler(async (req, res) => {
  // solo admin
  if (req.userRole !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  const now = new Date();
  const daysAgo7 = new Date(now);
  daysAgo7.setDate(now.getDate() - 7);

  // 1) utenti totali e nuovi ultimi 7gg
  const [totalUsers, newUsersLast7d] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: daysAgo7 } }),
  ]);

  // 2) opere totali e nuove ultimi 7gg
  const [totalArtworks, newArtworksLast7d] = await Promise.all([
    Artwork.countDocuments(),
    Artwork.countDocuments({ createdAt: { $gte: daysAgo7 } }),
  ]);

  // 3) commenti totali
  const totalComments = await Comment.countDocuments();

  // 4) segnalazioni per stato
  const reportsAgg = await Report.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const reports = { Open: 0, Resolved: 0, Ignored: 0 };
  reportsAgg.forEach((r) => {
    reports[r._id] = r.count;
  });

  // 5) Top 5 opere più popolari (per numero di favorite)
  const topArtworks = await Favorite.aggregate([
    { $group: { _id: "$artwork", favoriteCount: { $sum: 1 } } },
    { $sort: { favoriteCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "artworks",
        localField: "_id",
        foreignField: "_id",
        as: "artwork",
      },
    },
    { $unwind: "$artwork" },
    {
      $project: {
        _id: 0,
        artworkId: "$_id",
        title: "$artwork.title",
        favoriteCount: 1,
      },
    },
  ]);

  // 6) Top 5 categorie più popolari (somma delle favorite delle opere per categoria)
  const topCategories = await Favorite.aggregate([
    // prendo l'artwork di ciascuna favorite
    {
      $lookup: {
        from: "artworks",
        localField: "artwork",
        foreignField: "_id",
        as: "art",
      },
    },
    { $unwind: "$art" },
    { $unwind: "$art.categories" },
    {
      $group: {
        _id: "$art.categories",
        favoriteCount: { $sum: 1 },
      },
    },
    { $sort: { favoriteCount: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $project: {
        _id: 0,
        categoryId: "$_id",
        name: "$category.name",
        favoriteCount: 1,
      },
    },
  ]);

  res.json({
    totalUsers,
    newUsersLast7d,
    totalArtworks,
    newArtworksLast7d,
    totalComments,
    reports,
    topArtworks,
    topCategories,
  });
});

module.exports = { getStats };
