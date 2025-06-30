import React, { useState, useEffect } from "react";
import { useCreateArtwork } from "../hooks/useCreateArtwork";
import { useFetchCategories } from "../hooks/useFetchCategories";
import { useFetchArtists } from "../hooks/useFetchArtists"; // assume implemented

const CreatePin = () => {
  const { create, loading, error } = useCreateArtwork();
  const { categories } = useFetchCategories();
  const { artists } = useFetchArtists();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkResource, setLinkResource] = useState("");
  const [tags, setTags] = useState("");
  const [categoryIds, setCategoryIds] = useState([]);
  const [artistId, setArtistId] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      title,
      description,
      linkResource,
      tags: tags.split(",").map((t) => t.trim()),
      categories: categoryIds,
      artistId,
    };
    await create(data);
  };

  return (
    <div>
      <h1>Create Pin</h1>
      <form onSubmit={handleSubmit}>
        <label>Title:</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label>Image URL:</label>
        <input
          value={linkResource}
          onChange={(e) => setLinkResource(e.target.value)}
          required
        />

        <label>Tags (comma separated):</label>
        <input value={tags} onChange={(e) => setTags(e.target.value)} />

        <label>Artist:</label>
        <select
          value={artistId}
          onChange={(e) => setArtistId(e.target.value)}
          required
        >
          <option value="">Select artist</option>
          {artists.map((a) => (
            <option key={a._id} value={a._id}>
              {a.displayName}
            </option>
          ))}
        </select>

        <label>Categories:</label>
        <select
          multiple
          value={categoryIds}
          onChange={(e) =>
            setCategoryIds(
              Array.from(e.target.selectedOptions, (opt) => opt.value)
            )
          }
        >
          {categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Pin"}
        </button>
        {error && <p>Error: {error.message || error}</p>}
      </form>
    </div>
  );
};

export default CreatePin;
