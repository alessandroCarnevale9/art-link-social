import apiFetch from "../utils/apiFetch";

// pubblici o self
export const getMe = () => apiFetch("/api/users/me");
export const updateMe = (data) =>
  apiFetch("/api/users/me", { method: "PATCH", body: data });

// admin only
export const getAllUsers = (params) => apiFetch("/api/users", { params });
export const getUserById = (id) => apiFetch(`/api/users/${id}`);
export const createUser = (data) =>
  apiFetch("/api/users/register", { method: "POST", body: data });
export const updateUser = (id, data) =>
  apiFetch(`/api/users/${id}`, { method: "PATCH", body: data });
export const deleteUser = (id) =>
  apiFetch(`/api/users/${id}`, { method: "DELETE" });
