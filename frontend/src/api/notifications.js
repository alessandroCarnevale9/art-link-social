import apiFetch from "../utils/apiFetch";

export const getNotifications = () => apiFetch("/api/notifications");
