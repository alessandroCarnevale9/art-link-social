// middleware/verifyJWT.js
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");

const verifyJWT = asyncHandler(async (req, res, next) => {

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer "))
    throw new ApiError(401, "Missing token");

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(403, "Invalid token");
  }

  // estraiamo email e ruolo dal payload
  req.userEmail = decoded.UserInfo.email;
  req.userRole = decoded.UserInfo.role;

  next();
});

module.exports = verifyJWT;
