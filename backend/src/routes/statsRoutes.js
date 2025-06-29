const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const { getStats } = require("../controllers/statsController");

router.use(verifyJWT);

// GET /api/stats
router.get("/", getStats);

module.exports = router;
