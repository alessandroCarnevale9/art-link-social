const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const artCtrl = require("../controllers/artworksController");

// Public routes (guest o autenticati)
router.get("/", artCtrl.getAllArtworks);
router.get("/:id", artCtrl.getArtworkById);

// Tutte le rotte seguenti richiedono JWT valido
router.use(verifyJWT);

// Creazione di un nuovo artwork
router.post("/", artCtrl.createArtwork);

// Modifica di un artwork esistente
router.patch("/:id", artCtrl.updateArtwork);

// Eliminazione di un artwork
router.delete("/:id", artCtrl.deleteArtwork);

module.exports = router;
