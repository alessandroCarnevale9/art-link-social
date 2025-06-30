const { User, GeneralUser, AdminUser } = require("../models/UserModel");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const {
  generateAccessToken,
  generateRefreshToken,
  attachRefreshTokenCookie,
} = require("../services/tokenService");
const ApiError = require("../utils/ApiError");
const { buildUserInfo } = require("../utils/userHelpers");
const getDataUri = require("../utils/datauri");
const { uploadToCloudinary } = require("../utils/cloudinary");

// @desc Get all users (admin only)
// @route GET /api/users
// @access Admin
const getAllUsers = asyncHandler(async (req, res) => {
  if (req.userRole !== "admin") {
    throw new ApiError(403, "Forbidden");
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;

  // 1) recupera solo i campi essenziali
  const [total, users] = await Promise.all([
    User.countDocuments(),
    User.find().select("-passwordHash").skip(skip).limit(limit).lean(),
  ]);

  // 2) per ciascun utente, ricava via buildUserInfo i contatori
  const data = await Promise.all(
    users.map(async (u) => {
      const { userData } = await buildUserInfo(u);
      return userData;
    })
  );

  res.json({ total, page, limit, data });
});

// @desc Get a user
// @route GET /api/users/:id
// @access Admin or general (self or other general)
const getUser = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.id)
    .select("-passwordHash")
    .lean();
  if (!targetUser) {
    throw new ApiError(404, "User not found.");
  }

  if (req.userRole === "general") {
    const isSelf =
      targetUser.email.toLowerCase() === req.userEmail.toLowerCase();
    if (!isSelf && targetUser.role !== "general") {
      throw new ApiError(403, "Forbidden");
    }
  }

  const { userData } = await buildUserInfo(targetUser);
  res.json(userData);
});

const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Controllo unicità email
  const existing = await User.findOne({
    email: email.trim().toLowerCase(),
  }).exec();
  if (existing) {
    throw new ApiError(409, `User with email ${email} already exists.`);
  }

  // Hash della password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  let newUser;
  if (role === "admin") {
    newUser = await AdminUser.create({
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
    });
  } else {
    newUser = await GeneralUser.create({
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
    });
  }

  const { payload, userData } = await buildUserInfo(newUser);

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  attachRefreshTokenCookie(res, refreshToken);

  res.status(201).json({ userData, accessToken });
});

// @desc Update a user (self or admin)
// @route PATCH /api/users/:id (o /api/users/me tramite mapMe)
// @access Admin or User self
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1) Verifico che l'utente esista
  const targetUser = await User.findById(id).exec();
  if (!targetUser) throw new ApiError(404, "User not found.");

  // 2) Controllo permessi: admin o se stesso
  const meEmail = req.userEmail.toLowerCase();
  const meRole = req.userRole;
  const isSelf = targetUser.email.toLowerCase() === meEmail;

  if (meRole !== "admin" && !isSelf) {
    throw new ApiError(403, "Forbidden");
  }

  // 3) Non permetto di cambiare il role qui
  if (req.body.role !== undefined) {
    throw new ApiError(400, "Role cannot be changed here.");
  }

  // 4) Preparo updateData con tutti i campi ammessi
  const updateData = {};

  // — Dati base (self o admin)
  if (req.body.firstName !== undefined) {
    updateData.firstName = req.body.firstName.trim();
  }
  if (req.body.lastName !== undefined) {
    updateData.lastName = req.body.lastName.trim();
  }
  if (req.body.bio !== undefined) {
    updateData.bio = req.body.bio.trim();
  }

  // — Email e password
  if (req.body.email) {
    updateData.email = req.body.email.trim().toLowerCase();
  }
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(req.body.password, salt);
  }

  // — Solo admin può modificare isActive
  if (meRole === "admin" && typeof req.body.isActive !== "undefined") {
    updateData.isActive = req.body.isActive;
  }

  // — Se multer ha estratto req.file, upload dell'immagine
  if (req.file) {
    const fileUri = getDataUri(req.file);
    const cloudResponse = await uploadToCloudinary(fileUri);
    updateData.profileImage = cloudResponse.secure_url;
  }

  // 5) Determine the correct model to use based on user role
  let UserModel;
  if (targetUser.role === "general") {
    UserModel = GeneralUser;
  } else if (targetUser.role === "admin") {
    UserModel = AdminUser;
  } else {
    UserModel = User; // fallback
  }

  // 6) Applico l'update usando il modello appropriato
  const updated = await UserModel.findByIdAndUpdate(id, updateData, {
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
  getUser,
  createUser,
  updateUser,
  deleteUser,
};
