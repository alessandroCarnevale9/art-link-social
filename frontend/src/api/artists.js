import apiFetch from "../utils/apiFetch";

// GET all artists
export const getAllArtists = () => apiFetch("/api/artists");

// GET one artist
export const getArtistById = (id) => apiFetch(`/api/artists/${id}`);

// Create artist
export const createArtist = (data) =>
  apiFetch("/api/artists", { method: "POST", body: data });

// Update artist
export const updateArtist = (id, data) =>
  apiFetch(`/api/artists/${id}`, { method: "PATCH", body: data });

// Delete artist
export const deleteArtist = (id) =>
  apiFetch(`/api/artists/${id}`, { method: "DELETE" });
