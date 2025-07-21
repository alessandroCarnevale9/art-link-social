const express = require("express");
const asyncHandler = require("express-async-handler");
const metClient = require("../services/metApiClient");
const { importMetArtwork } = require("../controllers/metController");
const authenticate = require("../middleware/verifyJWT");

const router = express.Router();

/**
 * GET /api/met/search?q=...&hasImages=...
 */
router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const { q, hasImages = true } = req.query;
    if (!q?.trim()) {
      return res.status(400).json({ error: "Query mancante" });
    }
    const result = await metClient.search(
      q,
      hasImages === "false" ? false : true
    );
    res.json(result);
  })
);

/**
 * GET /api/met/objects/:id
 */
router.get(
  "/objects/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "ID non valido" });
    }
    const result = await metClient.getObjectById(id);
    res.json(result);
  })
);

/**
 * POST /api/met/artworks/external/:id
 * Crea o recupera in DB l’artwork con origin="MET"
 */
router.post(
  "/artworks/external/:id",
  authenticate,
  asyncHandler(importMetArtwork)
);

/**
 * GET /api/met/objects?departmentIds=...
 */
router.get(
  "/objects",
  asyncHandler(async (req, res) => {
    const { departmentIds } = req.query;
    if (!departmentIds) {
      return res.status(400).json({ error: "DepartmentId mancante" });
    }
    const result = await metClient.listByDepartment(departmentIds);
    res.json(result);
  })
);

module.exports = router;
