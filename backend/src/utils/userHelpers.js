function buildUserInfo(user) {
  const base = {
    id: user._id,
    email: user.email,
    role: user.role,
  };
  // aggiungo i campi “general” solo se user.role === 'general'
  if (user.role === "general") {
    base.firstName = user.firstName;
    base.lastName = user.lastName;
    base.bio = user.bio;
    base.profileImage = user.profileImage;
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
