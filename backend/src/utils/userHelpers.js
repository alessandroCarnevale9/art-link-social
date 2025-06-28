// src/utils/userHelpers.js
const Follow = require("../models/FollowModel");
const Favorite = require("../models/FavoriteModel");
const Comment = require("../models/CommentModel");

async function buildUserInfo(user) {
  const id = user._id.toString();
  const email = user.email;
  const role = user.role;

  // conta followers, following, favorites, comments
  const [followersCount, followingCount, favoritesCount, commentsCount] =
    await Promise.all([
      Follow.countDocuments({ followeeId: id }),
      Follow.countDocuments({ followerId: id }),
      Favorite.countDocuments({ user: id }),
      Comment.countDocuments({ authorId: id }),
    ]);

  // il payload per i token
  const payload = { id, email, role };

  // i dati che invierai al client
  const userData = {
    id,
    email,
    role,
    firstName: user.firstName,
    lastName: user.lastName,
    bio: user.bio,
    profileImage: user.profileImage,
    isActive: user.isActive,
    followersCount,
    followingCount,
    favoritesCount,
    commentsCount,
  };

  return { payload, userData };
}

module.exports = { buildUserInfo };
