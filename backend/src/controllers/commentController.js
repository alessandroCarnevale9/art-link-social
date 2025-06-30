const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Comment = require("../models/CommentModel");
const Artwork = require("../models/ArtworkModel");
const notificationService = require("../services/notificationService");

/**
 * GET /api/artworks/:id/comments
 */
const getComments = asyncHandler(async (req, res) => {
  const artId = req.params.id;

  // Verifica che l’artwork esista
  const exists = await Artwork.exists({ _id: artId });
  if (!exists) {
    throw new ApiError(404, "Artwork not found.");
  }

  let comments = await Comment.find({ artworkId: artId })
    .populate("authorId", "firstName lastName profileImage")
    .sort({ createdAt: -1 })
    .lean();

  comments = comments.map((c) => ({
    ...c,
    author: c.authorId,
    authorId: undefined,
  }));

  res.json(comments);
});

/**
 * POST /api/artworks/:id/comments
 */
const addComment = asyncHandler(async (req, res) => {
  const artId = req.params.id;
  const userId = req.userId;
  const { text } = req.body;

  if (!text?.trim()) {
    throw new ApiError(400, "Comment text is required.");
  }

  // Verifica che l’artwork esista
  const art = await Artwork.findById(artId).select("authorId").lean();
  if (!art) {
    throw new ApiError(404, "Artwork not found.");
  }

  // Crea il commento
  const comment = await Comment.create({
    artworkId: artId,
    authorId: userId,
    text: text.trim(),
  });

  // Notifica in background il proprietario dell’opera
  notificationService
    .notifyNewComment(userId, art.authorId, artId)
    .catch(console.error);

  res.status(201).json(comment);
});

/**
 * DELETE /api/artworks/:id/comments/:cid
 */
const deleteComment = asyncHandler(async (req, res) => {
  const { id: artId, cid } = req.params;
  const userId = req.userId;
  const userRole = req.userRole;

  const comment = await Comment.findById(cid);
  if (!comment || comment.artworkId.toString() !== artId) {
    throw new ApiError(404, "Comment not found.");
  }

  // Solo admin o autore del commento
  if (userRole !== "admin" && comment.authorId.toString() !== userId) {
    throw new ApiError(403, "Forbidden");
  }

  await comment.deleteOne();
  res.status(204).send();
});

module.exports = {
  getComments,
  addComment,
  deleteComment,
};
