const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const { getFeed } = require("../controllers/feedController");

router.use(verifyJWT);

// GET /api/feed
router.get("/", getFeed);

module.exports = router;
