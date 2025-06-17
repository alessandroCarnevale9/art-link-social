const validator = require('validator')

const validateFields = (req, res, next) => {
    
    const { email, password } = req.body

    if(!email || !password)
        return res.status(400).json({ error: `Email and password are needed.` })

    if(!validator.isEmail(email))
        return res.status(400).json({ error: `Email is not valid.` })

    if(!validator.isStrongPassword(password))
        return res.status(400).json({ error: `Password not strong enough.` })

    next()
}

module.exports = validateFields