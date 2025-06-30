import React from "react";
import CategoryCard from "./CategoryCard";

function CategoryList({ categories }) {
  return (
    <div>
      {categories.map((cat) => (
        <CategoryCard key={cat._id} category={cat} />
      ))}
    </div>
  );
}

export default CategoryList;
