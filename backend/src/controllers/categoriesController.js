const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Category = require("../models/CategoryModel");

/**
 * GET /api/categories
 * Retrieve all categories (public)
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().lean();
  res.json(categories);
});

/**
 * GET /api/categories/:id
 * Retrieve a single category by ID, including its artworks (public)
 */
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate({
      path: "artworks", // virtual field
      select:
        "title publishDate linkResource medium dimensions origin description",
      populate: {
        path: "artistId", // popolo solo l'artista per ciascuna opera
        select: "name",
      },
    })
    .lean();

  if (!category) throw new ApiError(404, "Category not found.");
  res.json(category);
});

/**
 * POST /api/categories
 * Create a new category (admin only)
 */
const createCategory = asyncHandler(async (req, res) => {
  if (req.userRole !== "admin") throw new ApiError(403, "Forbidden");

  const { name, description } = req.body;
  if (!name?.trim()) {
    throw new ApiError(400, "Name is required.");
  }

  const exists = await Category.findOne({ name: name.trim() }).lean();
  if (exists) throw new ApiError(409, "Category already exists.");

  const category = await Category.create({ name: name.trim(), description });
  res.status(201).json({ message: "Category created.", category });
});

/**
 * PATCH /api/categories/:id
 * Update an existing category (admin only)
 */
const updateCategory = asyncHandler(async (req, res) => {
  if (req.userRole !== "admin") throw new ApiError(403, "Forbidden");

  const { name, description } = req.body;
  const update = {};

  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, "Name cannot be empty.");
    update.name = name.trim();
  }
  if (description !== undefined) update.description = description;

  const category = await Category.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!category) throw new ApiError(404, "Category not found.");
  res.json({ message: "Category updated.", category });
});

/**
 * DELETE /api/categories/:id
 * Delete a category (admin only)
 */
const deleteCategory = asyncHandler(async (req, res) => {
  if (req.userRole !== "admin") throw new ApiError(403, "Forbidden");
  const category = await Category.findByIdAndDelete(req.params.id).lean();
  if (!category) throw new ApiError(404, "Category not found.");
  res.json({ message: "Category deleted." });
});

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
