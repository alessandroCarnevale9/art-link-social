import apiFetch from "../utils/apiFetch";

// creo una segnalazione
export const createReport = (data) =>
  apiFetch("/api/reports", { method: "POST", body: data });

// leggo segnalazioni (admin)
export const getReports = (params) => apiFetch("/api/reports", { params });

// gestisco (PATCH) una segnalazione
export const handleReport = (id, data) =>
  apiFetch(`/api/reports/${id}`, { method: "PATCH", body: data });
