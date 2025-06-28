// middleware che mappa l'id dell'utente loggato in req.params.id
module.exports = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Se l’id è "me" **o** non è definito (es. su /me), sostituisci
  if (!req.params.id || req.params.id === "me") {
    req.params.id = req.userId;
  }

  next();
};
