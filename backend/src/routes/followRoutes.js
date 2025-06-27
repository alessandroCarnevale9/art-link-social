const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const mapMe = require("../middleware/mapMe");
const followCtrl = require("../controllers/followController");

router.use(verifyJWT);

// “Me” endpoints
router.get("/followers", mapMe, followCtrl.getFollowers);
router.get("/following", mapMe, followCtrl.getFollowing);

// Public endpoints by user ID
router.post("/:id", followCtrl.followUser);
router.delete("/:id", followCtrl.unfollowUser);
router.get("/followers/:id", followCtrl.getFollowers);
router.get("/following/:id", followCtrl.getFollowing);

module.exports = router;
