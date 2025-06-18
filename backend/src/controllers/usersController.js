const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const validator = require("validator");

/** Validazione per la creazione */
function validateCreate({ email, password, role }) {
  const errors = [];
  const ALLOWED_ROLES = ["general", "admin"];

  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");
  if (role && !ALLOWED_ROLES.includes(role)) {
    errors.push("Invalid role");
  }
  if (email && !validator.isEmail(email)) {
    errors.push("Email is not valid");
  }
  if (
    password &&
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    errors.push(
      "Password not strong enough (8+ chars, uppercase, lowercase, number, symbol)"
    );
  }
  return errors;
}

/** Validazione per l'update (campi opzionali) */
function validateUpdate({ email, password }) {
  const errors = [];
  if (email && !validator.isEmail(email)) {
    errors.push("Email is not valid");
  }
  if (
    password &&
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    errors.push("Password not strong enough");
  }
  return errors;
}

// @desc Get all users (admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const requesterEmail = req.user;
  const requesterRole = req.role;
  if (!requesterEmail || !requesterRole) {
    return res.sendStatus(401);
  }
  if (requesterRole !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const users = await User.find().select("-passwordHash").lean();
  if (!users.length) {
    return res.status(404).json({ error: "No users found" });
  }
  res.json(users);
});

// @desc Create a new user
const createUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  const errors = validateCreate({ email, password, role });
  if (errors.length) {
    return res.status(400).json({ error: errors });
  }

  // hash & save
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const newUser = new User({
    email: email.trim().toLowerCase(),
    passwordHash,
    role,
  });
  await newUser.save();

  const userObj = newUser.toObject();
  delete userObj.passwordHash;
  res.status(201).json(userObj);
});

// @desc Update a user
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "User ID is missing." });
  }

  const requesterEmail = req.user;
  const requesterRole = req.role;
  if (!requesterEmail || !requesterRole) {
    return res.sendStatus(401);
  }

  const targetUser = await User.findById(id).exec();
  if (!targetUser) {
    return res.status(404).json({ error: "User not found." });
  }

  // permessi: general solo sul proprio, admin su tutti
  if (
    requesterRole !== "admin" &&
    targetUser.email.toLowerCase() !== requesterEmail.toLowerCase()
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { email, password, isActive } = req.body;
  const errors = validateUpdate({ email, password });
  if (errors.length) {
    return res.status(400).json({ error: errors });
  }

  const updateData = {};
  if (email) {
    updateData.email = email.trim().toLowerCase();
  }
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(password, salt);
  }
  // solo admin può modificare isActive di un general
  if (
    requesterRole === "admin" &&
    typeof isActive !== "undefined" &&
    targetUser.role === "general"
  ) {
    updateData.isActive = isActive;
  }

  const updated = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .select("-passwordHash")
    .lean();

  res.json(updated);
  console.log(`Updated`);
});

// @desc Delete a user
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "User ID is missing." });
  }

  const targetUser = await User.findById(id).exec();
  if (!targetUser) {
    return res.status(404).json({ error: "User not found." });
  }

  const callerEmail = req.user;
  const callerRole = req.role;

  if (callerRole === "general") {
    if (targetUser.email.toLowerCase() !== callerEmail.toLowerCase()) {
      return res.status(403).json({ error: "Forbidden" });
    }
  } else if (callerRole === "admin") {
    if (
      targetUser.role === "admin" &&
      targetUser.email.toLowerCase() !== callerEmail.toLowerCase()
    ) {
      return res.status(403).json({ error: "Cannot delete another admin" });
    }
  } else {
    return res.status(400).json({ error: "Invalid role" });
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
