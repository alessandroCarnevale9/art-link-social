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
const ApiError = require("../utils/ApiError");

// POST /auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).exec();
  if (!user || !user.isActive) throw new ApiError(401, "Unauthorized");

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new ApiError(401, "Unauthorized");

  const payload = { UserInfo: { email: user.email, role: user.role } };
  const accessToken = generateAccessToken({ payload });
  const refreshToken = generateRefreshToken({ email: user.email });

  attachRefreshTokenCookie(res, refreshToken);

  const { _id, email: userEmail, role } = user;
  res.status(201).json({
    userData: { id: _id, email: userEmail, role },
    accessToken,
  });
});

// GET /auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.jwt;
  if (!token) throw new ApiError(401, "Unauthorized");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    clearRefreshTokenCookie(res);
    throw new ApiError(403, "Forbidden");
  }

  const user = await User.findOne({ email: payload.email }).exec();
  if (!user) {
    clearRefreshTokenCookie(res);
    throw new ApiError(401, "Unauthorized");
  }

  const accessToken = generateAccessToken({
    UserInfo: { email: user.email, role: user.role },
  });

  const { _id, email: userEmail, role } = user;
  res.status(201).json({
    userData: { id: _id, email: userEmail, role },
    accessToken,
  });
});

// POST /auth/logout
const logout = (req, res) => {
  if (!req.cookies?.jwt) return res.sendStatus(204);

  clearRefreshTokenCookie(res);
  return res.sendStatus(204);
};

module.exports = { login, refresh, logout };
