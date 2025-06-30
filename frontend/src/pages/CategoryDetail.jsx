import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useFetchCategory } from "../hooks/useFetchCategory";
import { useDeleteCategory } from "../hooks/useDeleteCategory";

function CategoryDetail() {
  const { categoryId } = useParams();
  const { category, loading, error } = useFetchCategory(categoryId);
  const { deleteCategory } = useDeleteCategory();
  const navigate = useNavigate();

  const handleDelete = async () => {
    await deleteCategory(categoryId);
    navigate("/categories");
  };

  if (loading) return <p>Loading category...</p>;
  if (error) return <p>Error: {error.message || error}</p>;
  if (!category) return <p>Category not found.</p>;

  return (
    <div>
      <h1>{category.name}</h1>
      <p>{category.description}</p>
      <Link to={`/edit-category/${categoryId}`}>Edit Category</Link>
      <button onClick={handleDelete}>Delete Category</button>

      <section>
        <h2>Artworks in this category</h2>
        {category.artworks && category.artworks.length > 0 ? (
          <ul>
            {category.artworks.map((art) => (
              <li key={art._id}>
                <Link to={`/pin/${art._id}`}>{art.title}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No artworks found in this category.</p>
        )}
      </section>
    </div>
  );
}

export default CategoryDetail;
