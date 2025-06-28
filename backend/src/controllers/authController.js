const { User } = require("../models/UserModel");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../services/tokenService");
const { buildUserInfo } = require("../utils/userHelpers");
const ApiError = require("../utils/ApiError");

// POST /auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).exec();
  if (!user || !user.isActive) throw new ApiError(401, "Unauthorized");

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) throw new ApiError(401, "Unauthorized");

  // Costruisci payload e userData in base al ruolo
  const { payload, userData } = buildUserInfo(user);

  // Generazione token
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  attachRefreshTokenCookie(res, refreshToken);

  res.status(201).json({ userData, accessToken });
});

// GET /auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.jwt;
  if (!token) throw new ApiError(401, "Unauthorized");

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    clearRefreshTokenCookie(res);
    throw new ApiError(403, "Forbidden");
  }

  // decoded.UserInfo deve contenere id, email, role
  const user = await User.findById(decoded.UserInfo.id).exec();
  if (!user) {
    clearRefreshTokenCookie(res);
    throw new ApiError(401, "Unauthorized");
  }

  // Ricostruisci payload e userData
  const { payload, userData } = buildUserInfo(user);

  const accessToken = generateAccessToken(payload);
  // Puoi scegliere se rigenerare o riutilizzare lo stesso refresh token
  attachRefreshTokenCookie(res, token);

  res.status(201).json({ userData, accessToken });
});

// POST /auth/logout
const logout = (req, res) => {
  if (!req.cookies?.jwt) return res.sendStatus(204);
  clearRefreshTokenCookie(res);
  return res.sendStatus(204);
};

module.exports = { login, refresh, logout };
