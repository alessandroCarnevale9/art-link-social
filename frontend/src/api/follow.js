import apiFetch from "../utils/apiFetch";

// seguo un utente
export const followUser = (userId) =>
  apiFetch(`/api/users/${userId}/follow`, { method: "POST" });
// smetto di seguire
export const unfollowUser = (userId) =>
  apiFetch(`/api/users/${userId}/follow`, { method: "DELETE" });
// lista dei miei followers/following
export const getFollowers = (userId) =>
  apiFetch(`/api/users/${userId}/followers`);
export const getFollowing = (userId) =>
  apiFetch(`/api/users/${userId}/following`);
