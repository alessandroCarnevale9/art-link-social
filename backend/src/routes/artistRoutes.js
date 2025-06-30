const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const {
  getAllArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist,
} = require("../controllers/artistsController");

// Public
router.get("/", getAllArtists);
router.get("/:id", getArtistById);

// Protected (admin only)
router.use(verifyJWT);
router.post("/", createArtist);
router.patch("/:id", updateArtist);
router.delete("/:id", deleteArtist);

module.exports = router;
