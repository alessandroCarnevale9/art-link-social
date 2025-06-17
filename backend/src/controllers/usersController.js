const User = require("../models/UserModel")
const bcrypt = require("bcrypt")

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash").lean()

    if(!users?.length)
        res.status(400).json({ message: `No users found` })

    res.json(users)

  } catch (err) {
    res.status(500)
  }
}

// @desc Create a new user
// @route POST /users
// @access Private
const createUser = async (req, res) => {
  
  const { email, password, role } = req.body

  try {
    // genera hash della password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const newUser = new User({
      email,
      passwordHash,
      role,
    })

    await newUser.save()

    // restituisci l’utente creato senza passwordHash
    const userObj = newUser.toObject()
    delete userObj.passwordHash

    res.status(201).json(userObj)
  } catch (err) {
    // gestisci conflitti sui campi unici
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ error: `Username or email already in use.` })
    }
    res.status(500).json({ error: err.message })
  }
}

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = async (req, res) => {
  
  const { id, email, password, role, isActive } = req.body
  
  if (!id)
    return res.status(400).json({ error: `User ID is missing.` })
  
  try {
    const updateData = { email, role, isActive }

    // se viene fornita nuova password, ricrea l’hash
    if (password) {
      const salt = await bcrypt.genSalt(10)
      updateData.passwordHash = await bcrypt.hash(password, salt)
    }

    // rimuovi campi undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key]
    })

    const updated = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-passwordHash")
      .lean()

    if (!updated) {
      return res.status(404).json({ error: `User not found` })
    }

    res.json(updated)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Username or email already in use.` })
    }
    res.status(500).json({ error: err.message })
  }
}

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
    const { id } = req.body
  if (!id) {
    return res.status(400).json({ error: `User ID is missing.` })
  }

  try {
    const deleted = await User.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ error: `User not found` })
    }
    res.json({ message: `User successfully deleted.` })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
}
