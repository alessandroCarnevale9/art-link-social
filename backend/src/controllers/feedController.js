const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Artwork = require("../models/ArtworkModel");
const Follow = require("../models/FollowModel");
const { buildPagination } = require("../utils/queryHelpers");

/**
 * GET /api/feed
 * – restituisce le opere degli autori che l’utente segue
 * – supporta page, limit, sortBy (date|popularity)
 */
const getFeed = asyncHandler(async (req, res) => {
  // 1) prendi l’ID dell’utente dal JWT
  const userId = req.userId;
  if (!userId) throw new ApiError(401, "Unauthorized");

  // 2) prendi la lista di followeeId
  const followDocs = await Follow.find({ followerId: userId })
    .select("followeeId -_id")
    .lean();
  const authors = followDocs.map((f) => f.followeeId);
  if (authors.length === 0) {
    return res.json({ total: 0, page: 1, limit: 0, data: [] });
  }

  // 3) paginazione e sort
  const { page, limit, skip } = buildPagination(req);
  const sortBy = req.query.sortBy === "popularity" ? "popularity" : "date";

  // 4) build filtro e sort
  const filter = { authorId: { $in: authors } };
  let sort;
  if (sortBy === "popularity") {
    sort = { favoritesCount: -1, createdAt: -1 };
  } else {
    sort = { createdAt: -1 };
  }

  // 5) esegui query
  const [total, data] = await Promise.all([
    Artwork.countDocuments(filter),
    Artwork.find(filter)
      .populate("artistId", "displayName")
      .populate("categories", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  // 6) rispondi
  res.json({ total, page, limit, data });
});

module.exports = { getFeed };
