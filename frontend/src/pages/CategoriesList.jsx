import React from "react";
import { Link } from "react-router-dom";
import { useFetchCategories } from "../hooks/useFetchCategories";
import CategoryList from "../components/CategoryList";

function CategoriesList() {
  const { categories, loading, error } = useFetchCategories();

  if (loading) return <p>Loading categories...</p>;
  if (error) return <p>Error: {error.message || error}</p>;

  return (
    <div>
      <h1>Categories</h1>
      <Link to="/create-category">Create New Category</Link>
      <CategoryList categories={categories} />
    </div>
  );
}

export default CategoriesList;
