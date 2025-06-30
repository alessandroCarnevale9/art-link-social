import apiFetch from "../utils/apiFetch";

export const getComments = (artId) =>
  apiFetch(`/api/artworks/${artId}/comments`);

export const addComment = (artId, data) =>
  apiFetch(`/api/artworks/${artId}/comments`, {
    method: "POST",
    body: data,
  });

export const deleteComment = (artId, cId) =>
  apiFetch(`/api/artworks/${artId}/comments/${cId}`, {
    method: "DELETE",
  });
