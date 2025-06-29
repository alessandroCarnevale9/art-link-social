import apiFetch from "../utils/apiFetch";

export const getAllCategories = () => apiFetch("/api/categories");

export const getCategoryById = (id) => apiFetch(`/api/categories/${id}`);

// admin only
export const createCategory = (data) =>
  apiFetch("/api/categories", { method: "POST", body: data });

export const updateCategory = (id, data) =>
  apiFetch(`/api/categories/${id}`, { method: "PATCH", body: data });

export const deleteCategory = (id) =>
  apiFetch(`/api/categories/${id}`, { method: "DELETE" });
