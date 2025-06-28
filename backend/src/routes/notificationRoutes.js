const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const ctrl = require("../controllers/notificationController");

router.use(verifyJWT);
router.get("/", ctrl.getNotifications);

module.exports = router;
