import apiFetch from "../utils/apiFetch";

export const getStats = () => apiFetch("/api/stats");
