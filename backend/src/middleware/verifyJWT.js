const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");

const verifyJWT = asyncHandler(async (req, res, next) => {
  console.log('verifyJWT start');
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer "))
    throw new ApiError(401, "Missing token");

  const token = authHeader.split(" ")[1];
  let decoded;

  // console.log(">> AUTH HEADER:", authHeader);
  // console.log(">> TOKEN TO VERIFY:", token);
  // console.log(">> SECRET:", process.env.ACCESS_TOKEN_SECRET);

  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log(">> DECODED PAYLOAD:", decoded);
  } catch (err) {
    // console.error(">> JWT VERIFY ERROR:", err.message);
    throw new ApiError(403, "Invalid token");
  }

  // estraiamo id, email e ruolo dal payload
  req.userId = decoded.UserInfo.id;
  req.userEmail = decoded.UserInfo.email;
  req.userRole = decoded.UserInfo.role;

  console.log('verifyJWT success userId=', decoded?.userId);

  next();
});

module.exports = verifyJWT;
