// middleware che mappa l’id dell’utente loggato in req.params.id
module.exports = (req, res, next) => {
  if (!req.userId) {
    // in teoria verifyJWT deve essere già passato prima
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.params.id = req.userId;
  next();
};
