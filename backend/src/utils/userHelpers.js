const Follow = require("../models/FollowModel");
const Favorite = require("../models/FavoriteModel");
const Comment = require("../models/CommentModel");

async function buildUserInfo(user) {
  // payload per i token
  const payload = {
    UserInfo: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    },
  };

  // dati base sempre restituiti
  const userData = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  if (user.role === "general") {
    // parallel count delle 4 collezioni
    const [followersCount, followingCount, favoritesCount, commentsCount] =
      await Promise.all([
        Follow.countDocuments({ followeeId: user._id }),
        Follow.countDocuments({ followerId: user._id }),
        Favorite.countDocuments({ user: user._id }),
        Comment.countDocuments({ authorId: user._id }),
      ]);

    Object.assign(userData, {
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      profileImage: user.profileImage,
      followersCount,
      followingCount,
      favoritesCount,
      commentsCount,
    });
  }

  return { payload, userData };
}

module.exports = { buildUserInfo };
