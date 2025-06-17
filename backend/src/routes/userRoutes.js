const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersController')

const validateFileds = require('../middleware/validation')

router.route('/')
    .get(usersController.getAllUsers)
    .post(validateFileds, usersController.createUser)
    .patch(validateFileds, usersController.updateUser)
    .delete(usersController.deleteUser)

module.exports = router
