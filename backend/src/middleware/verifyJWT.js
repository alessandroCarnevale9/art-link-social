const jwt = require('jsonwebtoken')

const verifyJWT = (req, res, next) => {
  // authorization header è sempre lowercase in Express
  const authHeader = req.headers.authorization;

  // controlla che esista e inizi con "Bearer "
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  // ricava il token
  const token = authHeader.split(' ')[1]

  // verifica il token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    // popola req.user e req.role
    req.user = decoded.UserInfo.username
    req.role = decoded.UserInfo.role
    next()
  })
};

module.exports = verifyJWT
