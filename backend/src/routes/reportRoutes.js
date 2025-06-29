const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const ctrl = require("../controllers/reportsController");

router.use(verifyJWT);

router.post("/", ctrl.createReport);
router.get("/", ctrl.getReports);
router.patch("/:id", ctrl.handleReport);

module.exports = router;
