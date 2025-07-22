const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");

const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing token");
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch {
    throw new ApiError(403, "Invalid token");
  }

  // **Allinea questo blocco** al payload che hai usato in jwt.sign()
  // E poi logga req.userId, non decoded.userId
  if (decoded.UserInfo) {
    req.userId = decoded.UserInfo.id;
    req.userEmail = decoded.UserInfo.email;
    req.userRole = decoded.UserInfo.role;
  } else {
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
  }

  console.log("verifyJWT success userId=", req.userId);
  next();
});

module.exports = verifyJWT;
