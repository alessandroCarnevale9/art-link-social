const User = require("../models/UserModel");
const asyncHandler = require('express-async-handler');
const bcrypt = require("bcrypt");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").lean();

    if (!users?.length) res.status(400).json({ message: `No users found` });

    res.json(users);
  } catch (err) {
    res.status(500);
  }
};

const createUser = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // genera hash della password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      passwordHash,
      role,
    });

    await newUser.save();

    // restituisci l’utente creato senza passwordHash
    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    res.status(201).json(userObj);
  } catch (err) {
    // gestisci conflitti sui campi unici
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: `Username or email already in use.` });
    }
    res.status(500).json({ error: err.message });
  }
};

const updateUser = asyncHandler(async (req, res) => {
  // 1) Prendo l'id dal path
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "User ID is missing." });
  }

  // 2) Estraggo il requester dal middleware JWT
  //    req.user = email, req.role = ruolo
  const requesterEmail = req.user;
  const requesterRole = req.role;
  if (!requesterEmail || !requesterRole) {
    return res.sendStatus(401);
  }

  // 3) Trovo l'utente target
  const targetUser = await User.findById(id).exec();
  if (!targetUser) {
    return res.status(404).json({ error: "User not found." });
  }

  // 4) Controllo permessi
  if (
    requesterRole !== "admin" &&
    targetUser.email.toLowerCase() !== requesterEmail.toLowerCase()
  ) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // 5) Costruisco updateData
  const { email, password, isActive } = req.body;
  const updateData = {};

  // tutti (admin e general) possono cambiare email/password sul proprio profilo
  if (email) {
    updateData.email = email.trim().toLowerCase();
  }
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(password, salt);
  }

  // solo admin, e solo sul profilo di un general, può modificare isActive
  if (
    requesterRole === "admin" &&
    typeof isActive !== "undefined" &&
    targetUser.role === "general"
  ) {
    updateData.isActive = isActive;
  }

  // 6) Rimuovo campi undefined
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  // 7) Applico l'update
  try {
    const updated = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-passwordHash")
      .lean();

    return res.json(updated);
  } catch (err) {
    // gestisco duplicati su email
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already in use." });
    }
    return res.status(500).json({ error: err.message });
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  // 1) Prendo l'id dal path
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "User ID is missing." });
  }

  // 2) Trovo l'utente target
  const targetUser = await User.findById(id).exec();
  if (!targetUser) {
    return res.status(404).json({ error: "User not found." });
  }

  // 3) Estraggo il caller dal middleware JWT
  //    req.user = email, req.role = 'admin' | 'general'
  const callerEmail = req.user;
  const callerRole = req.role;

  // 4) Controllo permessi
  if (callerRole === "general") {
    // un general può eliminare solo sé stesso
    if (targetUser.email.toLowerCase() !== callerEmail.toLowerCase()) {
      return res.status(403).json({ error: "Forbidden" });
    }
  } else if (callerRole === "admin") {
    // un admin può eliminare general o sé stesso, ma non altri admin
    if (
      targetUser.role === "admin" &&
      targetUser.email.toLowerCase() !== callerEmail.toLowerCase()
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }
  } else {
    // ruolo non riconosciuto (dovrebbe già essere escluso dal validator)
    return res.status(400).json({ error: "Invalid role" });
  }

  // 5) Elimino l'utente
  await targetUser.deleteOne();

  res.json({ message: "User successfully deleted." });
});

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
