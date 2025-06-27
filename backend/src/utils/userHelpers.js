function buildUserInfo(user) {
  const base = {
    id: user._id,
    email: user.email,
    role: user.role,
  };

  // campi “general” + contatori
  if (user.role === "general") {
    base.firstName = user.firstName;
    base.lastName = user.lastName;
    base.bio = user.bio;
    base.profileImage = user.profileImage;
    base.followersCount = Array.isArray(user.followers)
      ? user.followers.length
      : 0;
    base.followingCount = Array.isArray(user.following)
      ? user.following.length
      : 0;
    base.favoritesCount = Array.isArray(user.likedArtworks)
      ? user.likedArtworks.length
      : 0;
    base.commentsCount = Array.isArray(user.comments)
      ? user.comments.length
      : 0;
  }

  return {
    payload: {
      UserInfo: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    },
    userData: base,
  };
}

module.exports = { buildUserInfo };
