// src/utils/aggregationHelpers.js

/**
 * Popola il documento con l'artista collegato (può restare vuoto)
 */
function lookupArtist() {
  return [
    {
      $lookup: {
        from: "artists",
        localField: "artistId",
        foreignField: "_id",
        as: "artist",
      },
    },
    { $unwind: { path: "$artist", preserveNullAndEmptyArrays: true } },
  ];
}

/**
 * Popola il documento con le categorie collegate
 */
function lookupCategories() {
  return [
    {
      $lookup: {
        from: "categories",
        localField: "categories",
        foreignField: "_id",
        as: "categories",
      },
    },
  ];
}

/**
 * Aggiunge il contatore commentsCount ma non rimuove ancora l'array
 */
function addCommentsCount() {
  return [
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "artworkId",
        as: "comments",
      },
    },
    { $addFields: { commentsCount: { $size: "$comments" } } },
  ];
}

/**
 * Aggiunge il contatore favoritesCount ma non rimuove ancora l'array
 */
function addFavoriteCount() {
  return [
    {
      $lookup: {
        from: "favorites",
        localField: "_id",
        foreignField: "artwork",
        as: "favorites",
      },
    },
    { $addFields: { favoritesCount: { $size: "$favorites" } } },
  ];
}

/**
 * Un unico project per rimuovere tutti gli array temporanei
 */
function removeTempArrays() {
  return [
    {
      $project: {
        comments: 0,
        favorites: 0,
      },
    },
  ];
}

module.exports = {
  lookupArtist,
  lookupCategories,
  addCommentsCount,
  addFavoriteCount,
  removeTempArrays,
};
