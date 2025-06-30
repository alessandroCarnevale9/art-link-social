import React, { useState, useEffect } from "react";
import { useMyFavorites } from "../hooks/useMyFavorites";
import { useAddFavorite } from "../hooks/useAddFavorite";
import { useRemoveFavorite } from "../hooks/useRemoveFavorite";

/**
 * FavoriteButton toggles favorite status for a given artwork.
 * Props:
 * - artworkId: string
 */
function FavoriteButton({ artworkId }) {
  const { favorites, loading: favLoading } = useMyFavorites();
  const { addFavorite } = useAddFavorite();
  const { removeFavorite } = useRemoveFavorite();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set initial favorite state
  useEffect(() => {
    setIsFav(favorites.some((a) => a._id === artworkId));
  }, [favorites, artworkId]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isFav) {
        await removeFavorite(artworkId);
      } else {
        await addFavorite(artworkId);
      }
      setIsFav((prev) => !prev);
    } catch (err) {
      console.error("Favorite toggle error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (favLoading) return null;

  return (
    <button onClick={handleToggle} disabled={loading}>
      {isFav ? "Unfavorite" : "Favorite"}
    </button>
  );
}

export default FavoriteButton;
