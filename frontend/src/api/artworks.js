import apiFetch from "../utils/apiFetch";

// public
export const getAllArtworks = (params) => apiFetch("/api/artworks", { params }); // { total, page, limit, data }

export const getArtworkById = (id) => apiFetch(`/api/artworks/${id}`);

// protette
export const createArtwork = (data) =>
  apiFetch("/api/artworks", { method: "POST", body: data });

export const updateArtwork = (id, data) =>
  apiFetch(`/api/artworks/${id}`, { method: "PATCH", body: data });

export const deleteArtwork = (id) =>
  apiFetch(`/api/artworks/${id}`, { method: "DELETE" });
