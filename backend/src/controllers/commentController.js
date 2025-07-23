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

  // Verifica che l'artwork esista
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

  console.log(`Found ${comments.length} comments for artwork ${artId}`);

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

  // Verifica che l'artwork esista e ottieni l'authorId
  const art = await Artwork.findById(artId).select("authorId title").lean();
  if (!art) {
    throw new ApiError(404, "Artwork not found.");
  }

  // Crea il commento
  const comment = await Comment.create({
    artworkId: artId,
    authorId: userId,
    text: text.trim(),
  });

  // Popola i dati dell'autore per la risposta
  const populatedComment = await Comment.findById(comment._id)
    .populate("authorId", "firstName lastName profileImage")
    .lean();

  // Trasforma per il frontend
  const responseComment = {
    ...populatedComment,
    author: populatedComment.authorId,
    authorId: undefined,
  };

  // Notifica in background il proprietario dell'opera
  notificationService
    .notifyNewComment(userId, art.authorId, artId)
    .then((notification) => {
      if (notification) {
        console.log(
          "Comment notification sent successfully:",
          notification._id
        );
      }
    })
    .catch((error) => {
      console.error("Failed to send comment notification:", error);
    });

  console.log(`New comment added to artwork ${artId} by user ${userId}`);

  res.status(201).json({
    message: "Comment added successfully.",
    comment: responseComment,
  });
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

  // Solo admin o autore del commento può eliminarlo
  if (userRole !== "admin" && comment.authorId.toString() !== userId) {
    throw new ApiError(403, "You can only delete your own comments.");
  }

  await comment.deleteOne();

  console.log(`Comment ${cid} deleted from artwork ${artId} by user ${userId}`);

  res.status(204).send();
});

/**
 * GET /api/users/:id/comments
 * Ottiene tutti i commenti di un utente (opzionale - per il profilo)
 */
const getUserComments = asyncHandler(async (req, res) => {
  const userId = req.params.id === "me" ? req.userId : req.params.id;

  const comments = await Comment.find({ authorId: userId })
    .populate("artworkId", "title externalId")
    .populate("authorId", "firstName lastName profileImage")
    .sort({ createdAt: -1 })
    .lean();

  const formattedComments = comments.map((c) => ({
    ...c,
    author: c.authorId,
    artwork: c.artworkId,
    authorId: undefined,
    artworkId: undefined,
  }));

  console.log(`Found ${comments.length} comments by user ${userId}`);

  res.json(formattedComments);
});

module.exports = {
  getComments,
  addComment,
  deleteComment,
  getUserComments,
};
