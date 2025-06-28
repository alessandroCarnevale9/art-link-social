// middleware che mappa l'id dell'utente loggato in req.params.id
module.exports = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Se l'id nei parametri è "me", sostituiscilo con l'userId reale
  if (req.params.id === "me") {
    req.params.id = req.userId;
  }
  
  next();
};