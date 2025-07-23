import React, { useState, useEffect } from "react";
import "./NotificationsModal.css";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../../api/notifications";
import {
  FaTimes,
  FaTrash,
  FaCheck,
  FaCheckDouble,
  FaBell,
} from "react-icons/fa";
import ConfirmModal from "../ConfirmModal/ConfirmModal";

const NotificationsModal = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'
  const [actionLoading, setActionLoading] = useState({});
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // Helper: filtered list based on filter
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.isRead;
  });

  // Load notifications
  const loadNotifications = async (page = 1, reset = false) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        // Usa unreadOnly solo per il filtro "unread"
        ...(filter === "unread" && { unreadOnly: true }),
      };

      const response = await getNotifications(params);
      const incoming = response.notifications || [];

      if (reset) {
        setNotifications(incoming);
      } else {
        setNotifications((prev) => [...prev, ...incoming]);
      }

      setTotalPages(response.pagination?.totalPages || 1);
      setCurrentPage(page);

      // Aggiorna sempre il conteggio usando totalUnread dal backend
      const unreadCount = response.totalUnread ?? 0;
      onUnreadCountChange?.(unreadCount);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh on open or filter change
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      loadNotifications(1, true);
    }
  }, [isOpen, filter]);

  const handleFilterChange = (newFilter) => {
    if (newFilter !== filter) {
      setFilter(newFilter);
      setNotifications([]);
      setCurrentPage(1);
    }
  };

  // Actions: mark read, delete, etc.
  const handleMarkAsRead = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: "read" }));
    try {
      await markAsRead(id);

      // Aggiorna lo stato locale
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );

      // Calcola il nuovo conteggio di non lette
      const currentUnread = notifications.filter((n) => !n.isRead).length;
      const wasUnread =
        notifications.find((n) => n._id === id)?.isRead === false;
      const newUnreadCount = wasUnread
        ? Math.max(0, currentUnread - 1)
        : currentUnread;

      onUnreadCountChange?.(newUnreadCount);

      // Se stiamo visualizzando solo le non lette, rimuovi l'elemento
      if (filter === "unread") {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      }
    } catch (err) {
      console.error("Error marking as read:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading((prev) => ({ ...prev, all: "readAll" }));
    try {
      await markAllAsRead();

      // Aggiorna tutte le notifiche come lette
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      // Azzera il conteggio
      onUnreadCountChange?.(0);

      // Se stiamo visualizzando solo le non lette, svuota la lista
      if (filter === "unread") {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, all: null }));
    }
  };

  const handleDeleteNotification = (id) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Notification",
      message: "Are you sure you want to delete this notification?",
      onConfirm: () => confirmDeleteNotification(id),
    });
  };

  const confirmDeleteNotification = async (id) => {
    setConfirmModal((m) => ({ ...m, isOpen: false }));
    setActionLoading((prev) => ({ ...prev, [id]: "delete" }));
    try {
      const notificationToDelete = notifications.find((n) => n._id === id);
      const wasUnread = notificationToDelete && !notificationToDelete.isRead;

      await deleteNotification(id);

      // Rimuovi la notifica dalla lista
      setNotifications((prev) => prev.filter((n) => n._id !== id));

      // Se era non letta, decrementa il conteggio
      if (wasUnread) {
        const currentUnread = notifications.filter((n) => !n.isRead).length;
        const newUnreadCount = Math.max(0, currentUnread - 1);
        onUnreadCountChange?.(newUnreadCount);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleDeleteAll = () => {
    setConfirmModal({
      isOpen: true,
      title: "Delete All Notifications",
      message:
        "Are you sure you want to delete all notifications? This action cannot be undone.",
      onConfirm: confirmDeleteAll,
    });
  };

  const confirmDeleteAll = async () => {
    setConfirmModal((m) => ({ ...m, isOpen: false }));
    setActionLoading((prev) => ({ ...prev, all: "deleteAll" }));
    try {
      await deleteAllNotifications();

      // Svuota tutte le notifiche
      setNotifications([]);

      // Azzera il conteggio
      onUnreadCountChange?.(0);
    } catch (err) {
      console.error("Error deleting all notifications:", err);
    } finally {
      setActionLoading((prev) => ({ ...prev, all: null }));
    }
  };

  const loadMore = () => {
    if (!loading && currentPage < totalPages) {
      loadNotifications(currentPage + 1, false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(diff / 86400000);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US");
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-modal-overlay" onClick={onClose}>
      <div className="notifications-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-header">
          <h3>
            <FaBell className="header-icon" /> Notifications
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="notifications-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => handleFilterChange("all")}
          >
            All
          </button>
          <button
            className={filter === "unread" ? "active" : ""}
            onClick={() => handleFilterChange("unread")}
          >
            Unread
          </button>
          <button
            className={filter === "read" ? "active" : ""}
            onClick={() => handleFilterChange("read")}
          >
            Read
          </button>
        </div>

        <div className="notifications-actions">
          <button
            className="action-btn mark-all"
            onClick={handleMarkAllAsRead}
            disabled={
              actionLoading.all === "readAll" ||
              notifications.length === 0 ||
              notifications.every((n) => n.isRead) // Disabilita se tutte sono già lette
            }
          >
            <FaCheckDouble />{" "}
            {actionLoading.all === "readAll" ? "Marking..." : "Mark all read"}
          </button>
          <button
            className="action-btn delete-all"
            onClick={handleDeleteAll}
            disabled={
              actionLoading.all === "deleteAll" || notifications.length === 0
            }
          >
            <FaTrash />{" "}
            {actionLoading.all === "deleteAll" ? "Deleting..." : "Delete all"}
          </button>
        </div>

        <div className="notifications-list">
          {loading && notifications.length === 0 ? (
            <div className="loading">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <FaBell className="empty-icon" />
              <p>
                {filter === "all"
                  ? "No notifications found"
                  : filter === "unread"
                  ? "No unread notifications"
                  : "No read notifications"}
              </p>
            </div>
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${
                    !notification.isRead ? "unread" : ""
                  }`}
                >
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatDate(notification.createdAt)}
                      </span>
                      {notification.type && (
                        <span
                          className={`notification-type ${notification.type}`}
                        >
                          {notification.type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button
                        className="action-btn read"
                        onClick={() => handleMarkAsRead(notification._id)}
                        disabled={actionLoading[notification._id] === "read"}
                        title="Mark as read"
                      >
                        <FaCheck />
                      </button>
                    )}
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteNotification(notification._id)}
                      disabled={actionLoading[notification._id] === "delete"}
                      title="Delete notification"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}

              {currentPage < totalPages && (
                <button
                  className="load-more-btn"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load more notifications"}
                </button>
              )}
            </>
          )}
        </div>

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal((m) => ({ ...m, isOpen: false }))}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
};

export default NotificationsModal;
