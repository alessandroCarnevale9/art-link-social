const express = require("express");
const router = express.Router({ mergeParams: true });
const verifyJWT = require("../middleware/verifyJWT");
const mapMe = require("../middleware/mapMe");
const ctrl = require("../controllers/commentController");

// GET    /api/artworks/:id/comments
// aperta a tutti
router.get("/", ctrl.getComments);

router.use(verifyJWT);

// POST   /api/artworks/:id/comments
// req.body = { text: "..." }
router.post("/", mapMe, ctrl.addComment);

// DELETE /api/artworks/:id/comments/:cid
router.delete("/:cid", mapMe, ctrl.deleteComment);

module.exports = router;
