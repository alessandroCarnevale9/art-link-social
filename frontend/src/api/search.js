import apiFetch from "../utils/apiFetch";

export const search = (q, scope, page, limit) =>
  apiFetch("/api/search", {
    params: { q, scope, page, limit },
  });
