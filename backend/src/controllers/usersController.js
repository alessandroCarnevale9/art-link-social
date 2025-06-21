const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const {
  generateAccessToken,
  generateRefreshToken,
  attachRefreshTokenCookie,
} = require("../services/tokenService");
const ApiError = require("../utils/ApiError");

// @desc Get all users (admin only)
// @route GET /users
// @access Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const requesterEmail = req.userEmail;
  const requesterRole = req.userRole;
  if (!requesterEmail || !requesterRole) {
    throw new ApiError(401, "Unauthorized");
  }
  if (requesterRole !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  const users = await User.find().select("-passwordHash").lean();
  if (!users.length) {
    throw new ApiError(404, "No users found");
  }
  res.json(users);
});

// @desc Create a new user
// @route POST /users
// @access Admin or Public (e.g. registration)
const createUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const existing = await User.findOne({ email }).exec();
  if (existing) {
    throw new ApiError(409, `User with email ${email} already exists.`);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Creazione utente nel DB
  const newUser = await User.create({
    email: email.trim().toLowerCase(),
    passwordHash,
    role,
  });

  // Generazione token
  const payload = { UserInfo: { email: newUser.email, role: newUser.role } };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ email: newUser.email });

  attachRefreshTokenCookie(res, refreshToken);

  const { _id, email: userEmail, role: userRole } = newUser;
  res.status(201).json({
    userData: { id: _id, email: userEmail, userRole },
    accessToken,
  });
});

// @desc Update a user
// @route PATCH /users/:id
// @access Admin or User self
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "User ID is missing.");
  }

  const requesterEmail = req.userEmail;
  const requesterRole = req.userRole;
  if (!requesterEmail || !requesterRole) {
    throw new ApiError(401, "Unauthorized");
  }

  const targetUser = await User.findById(id).exec();
  if (!targetUser) {
    throw new ApiError(404, "User not found.");
  }

  // Permissions: general on own, admin on any
  if (
    requesterRole !== "admin" &&
    targetUser.email.toLowerCase() !== requesterEmail.toLowerCase()
  ) {
    throw new ApiError(403, "Forbidden");
  }

  const updateData = {};
  if (req.body.email) {
    updateData.email = req.body.email.trim().toLowerCase();
  }
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(req.body.password, salt);
  }
  // Only admin can toggle isActive for general users
  if (
    requesterRole === "admin" &&
    typeof req.body.isActive !== "undefined" &&
    targetUser.role === "general"
  ) {
    updateData.isActive = req.body.isActive;
  }

  const updated = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .select("-passwordHash")
    .lean();

  res.json(updated);
});

// @desc Delete a user
// @route DELETE /users/:id
// @access Admin or User self
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "User ID is missing.");
  }

  const targetUser = await User.findById(id).exec();
  if (!targetUser) {
    throw new ApiError(404, "User not found.");
  }

  const requesterEmail = req.userEmail;
  const requesterRole = req.userRole;

  if (requesterRole === "general") {
    if (targetUser.email.toLowerCase() !== requesterEmail.toLowerCase()) {
      throw new ApiError(403, "Forbidden");
    }
  } else if (requesterRole === "admin") {
    if (
      targetUser.role === "admin" &&
      targetUser.email.toLowerCase() !== requesterEmail.toLowerCase()
    ) {
      throw new ApiError(403, "Cannot delete another admin");
    }
  } else {
    throw new ApiError(400, "Invalid role");
  }

  await targetUser.deleteOne();
  res.json({ message: "User successfully deleted." });
});

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
