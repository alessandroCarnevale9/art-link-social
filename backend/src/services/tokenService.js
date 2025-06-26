const jwt = require("jsonwebtoken");

const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
}

// imposta il cookie httpOnly
function attachRefreshTokenCookie(res, token) {
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 1000 * 60 * 60 * 24 * 7, // corrisponde a 7d --> REFRESH_TOKEN_EXPIRES_IN
  });
}

// pulisci il cookie
function clearRefreshTokenCookie(res) {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  attachRefreshTokenCookie,
  clearRefreshTokenCookie,
};
