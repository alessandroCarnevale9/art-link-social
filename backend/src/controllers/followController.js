const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const { User } = require("../models/UserModel");
const Follow = require("../models/FollowModel");
const notificationService = require("../services/notificationService");

// POST /users/:id/follow
const followUser = asyncHandler(async (req, res) => {
  const followerId = req.userId;
  const followeeId = req.params.id;

  if (followerId === followeeId) {
    throw new ApiError(400, "You cannot follow yourself.");
  }

  const exists = await User.exists({ _id: followeeId });
  if (!exists) throw new ApiError(404, "User not found.");

  // Crea o ignora duplicato
  const result = await Follow.findOneAndUpdate(
    { followerId, followeeId },
    { $setOnInsert: { followerId, followeeId, followDate: Date.now() } },
    { upsert: true, new: false }
  );

  // Se new:true allora era un insert
  if (result) {
    // ignora: già seguito
    return res.status(204).send();
  }

  // Notifica in background
  notificationService
    .notifyNewFollower(followerId, followeeId)
    .catch(console.error);

  res.status(201).json({ message: "Now following user." });
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
