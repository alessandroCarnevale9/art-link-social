const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const User = require("../models/UserModel").GeneralUser;
const notificationService = require("../services/notificationService");

// POST /users/:id/follow
const followUser = asyncHandler(async (req, res) => {
  const meId = req.userId;
  const targetId = req.params.id;
  if (meId === targetId) throw new ApiError(400, "You cannot follow yourself.");

  // Provo ad aggiungere solo se non c’è già
  const me = await User.findOneAndUpdate(
    { _id: meId, following: { $ne: targetId } }, // condizione: non seguo già
    { $addToSet: { following: targetId } },
    { new: true }
  );
  if (!me) {
    // o non esiste meId, o già seguivo targetId
    throw new ApiError(409, "You are already following this user.");
  }

  // Aggiorno anche il contesto opposto
  const target = await User.findByIdAndUpdate(targetId, {
    $addToSet: { followers: meId },
  });
  if (!target) throw new ApiError(404, "User not found.");

  // Notifica di nuovo follower
  await notificationService.notifyNewFollower(meId, targetId);

  res.status(201).json({ message: "You are now following this user." });
});

// DELETE /users/:id/follow
const unfollowUser = asyncHandler(async (req, res) => {
  const meId = req.userId;
  const targetId = req.params.id;

  const [me, target] = await Promise.all([
    User.findByIdAndUpdate(
      meId,
      { $pull: { following: targetId } },
      { new: true }
    ),
    User.findByIdAndUpdate(
      targetId,
      { $pull: { followers: meId } },
      { new: true }
    ),
  ]);
  if (!me || !target)
    throw new ApiError(404, "User not found or you were not following.");

  res.json({ message: "You have unfollowed the user." });
});

// GET /users/:id/followers
const getFollowers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate("followers", "firstName lastName profileImage")
    .lean();
  if (!user) throw new ApiError(404, "User not found.");
  res.json(user.followers);
});

// GET /users/:id/following
const getFollowing = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate("following", "firstName lastName profileImage")
    .lean();
  if (!user) throw new ApiError(404, "User not found.");
  res.json(user.following);
});

module.exports = {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
};
