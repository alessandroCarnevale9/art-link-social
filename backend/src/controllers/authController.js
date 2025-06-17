const User = require('../models/UserModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')

// @desc Login
// @route POST /auth
// @access Public
const login = asyncHandler(async (req, res) => {
    const {username, password} = req.body

    const foundUser = await User.findOne({ username })

    if(!foundUser || !foundUser.isActive) {
        return res.status(401).json({message: `Unauthorized`})
    }

    const match = await bcrypt.compare(password, foundUser.passwordHash)

    if(!match)
        return res.status(401).json({message: `Unauthorized`})

    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "username": foundUser.username,
                "role": foundUser.role
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: '60s'} // test
    )

    const refreshToken = jwt.sign(
        {"username": foundUser.username},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: '1d'} // test
    )

    // Create secure cookie with refresh token
    res.cookie('jwt', refreshToken, {
        httpOnly: true, // accessible only by web server
        secure: true, //https
        sameSite: 'None', // cross-site cookie
        maxAge: 7 * 24 * 60 * 60 * 1000 // cookie expiry: set to match the refresh token
    })

    // send accessToken containing username and role
    res.json({accessToken})
})


// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.jwt
  if (!token) return res.sendStatus(401); // Unauthorized

  let payload
  try {
    payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET)
  } catch (err) {
    // token scaduto o invalido: elimina cookie e 403
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'None',
      secure: true
    });
    return res.sendStatus(403)
  }

  // payload corretto, cerco l'utente in DB
  const user = await User.findOne({ username: payload.username }).exec()
  if (!user) {
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'None',
      secure: true
    })
    return res.sendStatus(401)
  }

  // genero nuovo access token
  const accessToken = jwt.sign(
    { UserInfo: { username: user.username, role: user.role } },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '60s' } // test
  );

  res.json({ accessToken })
});

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {

    const cookies = req.cookies
    if(!cookies?.jwt)
        return res.status(204) // no content

    res.clearCookie('jwt', {httpOnly: true, secure: true, sameSite: 'None'})
    res.json({message: `Cookie cleared`})
}

module.exports = {
    login,
    refresh,
    logout
}
