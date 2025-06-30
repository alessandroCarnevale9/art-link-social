import React from "react";
import { useMyFavorites } from "../hooks/useMyFavorites";
import FavoriteButton from "../components/FavoriteButton";
import { Link } from "react-router-dom";

/**
 * FavoritesList displays the current user's favorite artworks.
 */
function FavoritesList() {
  const { favorites, loading, error } = useMyFavorites();

  if (loading) return <p>Loading favorites...</p>;
  if (error) return <p>Error: {error.message || error}</p>;
  if (favorites.length === 0) return <p>No favorites yet.</p>;

  return (
    <div>
      <h1>My Favorites</h1>
      <ul>
        {favorites.map((fav) => (
          <li key={fav._id}>
            <Link to={`/pin/${fav._id}`}>{fav.title}</Link>
            <FavoriteButton artworkId={fav._id} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FavoritesList;
