// middleware che mappa l'id dell'utente loggato in req.params.id
module.exports = (req, res, next) => {
  console.log("mapMe start params:", req.params, "userId:", req.userId);

  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Se l'id è "me" **o** non è definito (es. su /me), sostituisci
  if (!req.params.id || req.params.id === "me") {
    req.params.id = req.userId;
  }

  console.log("mapMe end params:", req.params, "userId:", req.userId);
  next();
};
