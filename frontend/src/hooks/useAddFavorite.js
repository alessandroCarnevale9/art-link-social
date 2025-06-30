import { useState } from "react";
import { addFavorite } from "../api/favorites";

export const useAddFavorite = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const add = async (artworkId) => {
    setLoading(true);
    setError(null);
    try {
      await addFavorite(artworkId);
    } catch (err) {
      setError(err.payload || err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { addFavorite: add, loading, error };
};
