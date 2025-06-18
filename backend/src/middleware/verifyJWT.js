// middleware/verifyJWT.js
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const verifyJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res.status(401).json({ message: "Token mancante" });

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    return res.status(403).json({ message: "Token non valido" });
  }

  // estraiamo email e ruolo dal payload
  req.userEmail = decoded.UserInfo.email;
  req.userRole = decoded.UserInfo.role;
  next();
});

module.exports = verifyJWT;
