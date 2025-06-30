import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useFetchCategory } from "../hooks/useFetchCategory";
import { useUpdateCategory } from "../hooks/useUpdateCategory";

function EditCategory() {
  const { categoryId } = useParams();
  const {
    category,
    loading: loadCat,
    error: errCat,
  } = useFetchCategory(categoryId);
  const {
    updateCategory,
    loading: loadUpd,
    error: errUpd,
  } = useUpdateCategory(categoryId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setDescription(category.description || "");
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateCategory({ name, description });
  };

  if (loadCat) return <p>Loading category...</p>;
  if (errCat) return <p>Error: {errCat.message || errCat}</p>;

  return (
    <div>
      <h1>Edit Category</h1>
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button type="submit" disabled={loadUpd}>
          {loadUpd ? "Updating..." : "Update"}
        </button>
      </form>
      {errUpd && <p>Error: {errUpd.message || errUpd}</p>}
    </div>
  );
}

export default EditCategory;
