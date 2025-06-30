import React, { useState } from "react";
import { useCreateCategory } from "../hooks/useCreateCategory";

function CreateCategory() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { createCategory, loading, error } = useCreateCategory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createCategory({ name, description });
  };

  return (
    <div>
      <h1>Create Category</h1>
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

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
      {error && <p>Error: {error.message || error}</p>}
    </div>
  );
}

export default CreateCategory;
