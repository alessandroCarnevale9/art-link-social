import apiFetch from "../utils/apiFetch";

export const login = (data) =>
  apiFetch("/api/auth/login", { method: "POST", body: data });
export const refresh = () => apiFetch("/api/auth/refresh");
export const logout = () => apiFetch("/api/auth/logout", { method: "POST" });
