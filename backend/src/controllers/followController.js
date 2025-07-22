const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const { User } = require("../models/UserModel");
const Follow = require("../models/FollowModel");
const notificationService = require("../services/notificationService");

// POST /api/users/:id/follow
const followUser = asyncHandler(async (req, res) => {
  const followerId = req.userId;
  const followeeId = req.params.id;

  // Debug: log degli ID ricevuti
  console.log(
    "Follow request - Follower ID:",
    followerId,
    "Followee ID:",
    followeeId
  );

  // Validazione ID più robusta
  if (!followeeId || followeeId === "undefined" || followeeId === "null") {
    throw new ApiError(400, "User ID is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(followeeId)) {
    throw new ApiError(400, "Invalid user ID format.");
  }

  if (!followerId) {
    throw new ApiError(401, "You must be logged in to follow users.");
  }

  if (followerId === followeeId) {
    throw new ApiError(400, "You cannot follow yourself.");
  }

  // Verifica esistenza utente da seguire
  const userExists = await User.exists({ _id: followeeId });
  if (!userExists) {
    throw new ApiError(404, "User not found.");
  }

  try {
    // Verifica se già segui questo utente
    const existingFollow = await Follow.findOne({ followerId, followeeId });

    if (existingFollow) {
      return res.status(200).json({
        message: "Already following this user.",
        alreadyFollowing: true,
      });
    }

    // Crea il nuovo follow
    const newFollow = await Follow.create({
      followerId,
      followeeId,
      followDate: new Date(),
    });

    console.log("New follow created:", newFollow);

    // Invia notifica (non bloccante)
    notificationService
      .notifyNewFollower(followerId, followeeId)
      .catch(console.error);

    res.status(201).json({
      message: "Now following user.",
      follow: {
        _id: newFollow._id,
        followerId: newFollow.followerId,
        followeeId: newFollow.followeeId,
        followDate: newFollow.followDate,
      },
    });
  } catch (error) {
    console.error("Error in followUser:", error);

    // Gestisce errore di duplicazione (nel caso di race condition)
    if (error.code === 11000) {
      return res.status(200).json({
        message: "Already following this user.",
        alreadyFollowing: true,
      });
    }

    throw new ApiError(500, "Internal server error during follow operation.");
  }
});

// DELETE /api/users/:id/follow
const unfollowUser = asyncHandler(async (req, res) => {
  const followerId = req.userId;
  const followeeId = req.params.id;

  console.log(
    "Unfollow request - Follower ID:",
    followerId,
    "Followee ID:",
    followeeId
  );

  // Validazione ID
  if (!followeeId || followeeId === "undefined" || followeeId === "null") {
    throw new ApiError(400, "User ID is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(followeeId)) {
    throw new ApiError(400, "Invalid user ID format.");
  }

  if (!followerId) {
    throw new ApiError(401, "You must be logged in to unfollow users.");
  }

  const result = await Follow.findOneAndDelete({ followerId, followeeId });

  if (!result) {
    throw new ApiError(404, "You were not following this user.");
  }

  console.log("Unfollow successful:", result);

  res.json({
    message: "You have unfollowed the user.",
    unfollowed: {
      userId: followeeId,
      unfollowDate: new Date(),
    },
  });
});

// GET /api/users/:id/followers
// GET /api/users/me/followers
const getFollowers = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.userId;

  console.log("Get followers request for user:", userId);

  if (!userId || userId === "undefined" || userId === "null") {
    throw new ApiError(400, "User ID is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format.");
  }

  try {
    const followDocs = await Follow.find({ followeeId: userId })
      .populate("followerId", "firstName lastName profileImage email")
      .lean();

    const users = followDocs
      .map((doc) => doc.followerId)
      .filter((user) => user !== null); // Rimuove eventuali utenti eliminati

    console.log(`Found ${users.length} followers for user ${userId}`);

    res.json(users);
  } catch (error) {
    console.error("Error getting followers:", error);
    throw new ApiError(500, "Error retrieving followers.");
  }
});

// GET /api/users/:id/following
// GET /api/users/me/following
const getFollowing = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.userId;

  console.log("Get following request for user:", userId);

  if (!userId || userId === "undefined" || userId === "null") {
    throw new ApiError(400, "User ID is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format.");
  }

  try {
    const followDocs = await Follow.find({ followerId: userId })
      .populate("followeeId", "firstName lastName profileImage email")
      .lean();

    const users = followDocs
      .map((doc) => doc.followeeId)
      .filter((user) => user !== null); // Rimuove eventuali utenti eliminati

    console.log(`Found ${users.length} users followed by user ${userId}`);

    res.json(users);
  } catch (error) {
    console.error("Error getting following:", error);
    throw new ApiError(500, "Error retrieving following users.");
  }
});

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
