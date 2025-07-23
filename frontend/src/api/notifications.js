import apiFetch from "../utils/apiFetch";

// GET /api/notifications - Lista notifiche con paginazione e filtri
export const getNotifications = (params) =>
  apiFetch("/api/notifications", { params });

// GET /api/notifications/unread-count - Conteggio notifiche non lette
export const getUnreadCount = () => apiFetch("/api/notifications/unread-count");

// PUT /api/notifications/mark-all-read - Marca tutte come lette
export const markAllAsRead = () =>
  apiFetch("/api/notifications/mark-all-read", { method: "PUT" });

// PUT /api/notifications/:id/read - Marca singola notifica come letta
export const markAsRead = (id) =>
  apiFetch(`/api/notifications/${id}/read`, { method: "PUT" });

// DELETE /api/notifications/all - Elimina tutte le notifiche dell'utente
export const deleteAllNotifications = () =>
  apiFetch("/api/notifications/all", { method: "DELETE" });

// POST /api/notifications/cleanup - Pulizia notifiche vecchie (solo admin)
export const cleanupOldNotifications = () =>
  apiFetch("/api/notifications/cleanup", { method: "POST" });

// DELETE /api/notifications/:id - Elimina singola notifica
export const deleteNotification = (id) =>
  apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
