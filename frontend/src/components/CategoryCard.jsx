import React from "react";
import { Link } from "react-router-dom";

function CategoryCard({ category }) {
  return (
    <div>
      <h3>{category.name}</h3>
      <p>{category.description}</p>
      <Link to={`/category/${category._id}`}>View details</Link>
    </div>
  );
}

export default CategoryCard;
