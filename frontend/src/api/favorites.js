import apiFetch from "../utils/apiFetch";

// ottengo la lista favorites di “me”
export const getMyFavorites = () => apiFetch("/api/users/me/favorites");

// aggiungo un artwork ai miei favorites
export const addFavorite = (artworkId) =>
  apiFetch(`/api/users/me/favorites/${artworkId}`, { method: "POST" });

// rimuovo un favorite
export const removeFavorite = (artworkId) =>
  apiFetch(`/api/users/me/favorites/${artworkId}`, { method: "DELETE" });
