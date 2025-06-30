import { useState } from "react";
import { removeFavorite } from "../api/favorites";

export const useRemoveFavorite = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remove = async (artworkId) => {
    setLoading(true);
    setError(null);
    try {
      await removeFavorite(artworkId);
    } catch (err) {
      setError(err.payload || err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { removeFavorite: remove, loading, error };
};
