const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../services/tokenService");

// POST /auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).exec();
  if (!user || !user.isActive)
    return res.status(401).json({ message: "Unauthorized" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: "Unauthorized" });

  const accessToken = generateAccessToken({
    UserInfo: { email: user.email, role: user.role },
  });
  const refreshToken = generateRefreshToken({ email: user.email });

  attachRefreshTokenCookie(res, refreshToken);
  return res.json({ accessToken });
});

// GET /auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.jwt;
  if (!token) return res.sendStatus(401);

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    clearRefreshTokenCookie(res);
    return res.sendStatus(403);
  }

  const user = await User.findOne({ email: payload.email }).exec();
  if (!user) {
    clearRefreshTokenCookie(res);
    return res.sendStatus(401);
  }

  const accessToken = generateAccessToken({
    UserInfo: { email: user.email, role: user.role },
  });
  return res.json({ accessToken });
});

// POST /auth/logout
const logout = (req, res) => {
  if (!req.cookies?.jwt) return res.sendStatus(204);
  clearRefreshTokenCookie(res);
  return res.sendStatus(204);
};

module.exports = { login, refresh, logout };
