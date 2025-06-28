const express = require("express");
const router = express.Router({ mergeParams: true });
const verifyJWT = require("../middleware/verifyJWT");
const mapMe = require("../middleware/mapMe");
const ctrl = require("../controllers/followController");

// Tutte le rotte richiedono autenticazione
router.use(verifyJWT);
router.use(mapMe);

// POST   /api/users/:id/follow
router.post("/follow", ctrl.followUser);
// DELETE /api/users/:id/follow
router.delete("/follow", ctrl.unfollowUser);

// GET    /api/users/:id/followers
router.get("/followers", ctrl.getFollowers);
// GET    /api/users/:id/following
router.get("/following", ctrl.getFollowing);

module.exports = router;
