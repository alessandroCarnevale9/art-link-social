const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Artwork = require("../models/ArtworkModel");
const { User } = require("../models/UserModel");
const Category = require("../models/CategoryModel");
const { buildPagination, buildRegexFilter } = require("../utils/queryHelpers");

const search = asyncHandler(async (req, res) => {
  // 1) Parametri
  const q = req.query.q?.trim();
  const scope = req.query.scope || "all"; // artworks | users | categories | all
  if (!q) throw new ApiError(400, "Query parameter 'q' is required.");

  // 2) Paginazione
  const { page, limit, skip } = buildPagination(req);

  // 3) Costruisci il filtro base per testo
  //    qui cerchiamo solo su title per artworks,
  //    email per users, name per categories
  const results = {};
  let total = 0;

  // 4) Ricerca artworks
  if (scope === "artworks" || scope === "all") {
    const filter = buildRegexFilter(q, ["title", "tags", "medium"]);
    const [arts, count] = await Promise.all([
      Artwork.find(filter).skip(skip).limit(limit).lean(),
      Artwork.countDocuments(filter),
    ]);
    results.artworks = arts;
    total += count;
  }

  // 5) Ricerca users (general + admin) – cerchiamo su email e su firstName/lastName
  if (scope === "users" || scope === "all") {
    const filter = {
      $or: [
        { email: { $regex: q, $options: "i" } },
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
      ],
    };
    const [users, count] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    results.users = users;
    total += count;
  }

  // 6) Ricerca categories
  if (scope === "categories" || scope === "all") {
    const filter = { name: { $regex: q, $options: "i" } };
    const [cats, count] = await Promise.all([
      Category.find(filter).skip(skip).limit(limit).lean(),
      Category.countDocuments(filter),
    ]);
    results.categories = cats;
    total += count;
  }

  // 7) Rispondi
  res.json({ total, page, limit, results });
});

module.exports = { search };
