const express = require("express");
const router = express.Router();

const metClient = require("../services/metApiClient");

router.get("/search", async (req, res) => {
  const { q, hasImages = true } = req.query;
  if (!q || !q.trim()) return res.status(400).json({ error: "Query mancante" });

  try {
    const result = await metClient.search(q, hasImages);
    res.json(result);
  } catch (err) {}
});

router.get("/objects/:id", async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id))
    return res.status(400).json({ error: "ID non valido" });

  try {
    const result = await metClient.getObjectById(id);
    res.json(result);
  } catch (err) {}
});

router.get("/objects", async (req, res) => {
  const { departmentIds } = req.query;
  if (!departmentIds)
    return res.status(400).json({ error: "DepartmentId mancante" });

  try {
    const result = await metClient.listByDepartment(departmentIds);
    res.json(result);
  } catch (err) {}
});

module.exports = router;
