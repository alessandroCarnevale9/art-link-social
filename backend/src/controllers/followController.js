// src/controllers/followController.js
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Follow = require("../models/FollowModel");
const notificationService = require("../services/notificationService");

// POST /users/:id/follow
const followUser = asyncHandler(async (req, res) => {
  const followerId = req.userId;
  const followeeId = req.params.id;
  if (followerId === followeeId) {
    throw new ApiError(400, "You cannot follow yourself.");
  }

  // Creazione del follow (indice unico previene duplicati)
  try {
    await Follow.create({ followerId, followeeId });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "You are already following this user.");
    }
    throw err;
  }

  // Notifica di nuovo follower
  await notificationService.notifyNewFollower(followerId, followeeId);

  res.status(201).json({ message: "You are now following this user." });
});

// DELETE /users/:id/follow
const unfollowUser = asyncHandler(async (req, res) => {
  const followerId = req.userId;
  const followeeId = req.params.id;

  const result = await Follow.findOneAndDelete({ followerId, followeeId });
  if (!result) {
    throw new ApiError(404, "You were not following this user.");
  }

  res.json({ message: "You have unfollowed the user." });
});

// GET /users/:id/followers
const getFollowers = asyncHandler(async (req, res) => {
  const followDocs = await Follow.find({ followeeId: req.params.id })
    .populate("followerId", "firstName lastName profileImage")
    .lean();

  const users = followDocs.map((doc) => doc.followerId);
  res.json(users);
});

// GET /users/:id/following
const getFollowing = asyncHandler(async (req, res) => {
  const followDocs = await Follow.find({ followerId: req.params.id })
    .populate("followeeId", "firstName lastName profileImage")
    .lean();

  const users = followDocs.map((doc) => doc.followeeId);
  res.json(users);
});

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
