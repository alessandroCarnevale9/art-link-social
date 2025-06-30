import { useState } from "react";
import { createArtwork } from "../api/artworks";
import { useNavigate } from "react-router-dom";

export const useCreateArtwork = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const create = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await createArtwork(data);
      navigate("/");
    } catch (err) {
      setError(err.payload || err);
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
};
