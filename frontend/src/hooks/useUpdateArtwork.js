import { useState } from "react";
import { updateArtwork } from "../api/artworks";
import { useNavigate } from "react-router-dom";

export const useUpdateArtwork = (id) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const update = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await updateArtwork(id, data);
      navigate(`/pin/${id}`);
    } catch (err) {
      setError(err.payload || err);
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
};
