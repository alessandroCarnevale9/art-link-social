const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoriesController");

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Protected routes (admin only)
router.use(verifyJWT);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
