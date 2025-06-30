import { useState } from "react";
import { deleteArtwork } from "../api/artworks";
import { useNavigate } from "react-router-dom";

export const useDeleteArtwork = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const remove = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteArtwork(id);
      navigate("/");
    } catch (err) {
      setError(err.payload || err);
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
};
