import apiFetch from "../utils/apiFetch";

export const getFeed = (params) => apiFetch("/api/feed", { params });
