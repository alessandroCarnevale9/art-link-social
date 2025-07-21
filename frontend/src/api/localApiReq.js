import apiFetch from "../utils/apiFetch";

// upsert rapido di un MET‐ID
export const importMetArtwork = (externalId) =>
  apiFetch(`/api/met/artworks/external/${externalId}`, { method: "POST" });
