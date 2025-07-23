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

  // Load notifications
  const loadNotifications = async (page = 1, reset = false) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(filter !== "all" && { status: filter }),
      };

      const response = await getNotifications(params);

      if (reset) {
        setNotifications(response.notifications || []);
      } else {
        setNotifications((prev) => [
          ...prev,
          ...(response.notifications || []),
        ]);
      }

      setTotalPages(response.totalPages || 1);
      setCurrentPage(page);

      // Update unread notifications count
      const unreadCount =
        response.notifications?.filter((n) => !n.isRead).length || 0;
      onUnreadCountChange?.(response.totalUnread || unreadCount);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when modal opens or filter changes
  useEffect(() => {
    if (isOpen) {
      loadNotifications(1, true);
    }
  }, [isOpen, filter]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    setActionLoading((prev) => ({ ...prev, [notificationId]: "read" }));
    try {
      await markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );

      // Update count
      const unreadCount = notifications.filter(
        (n) => !n.isRead && n._id !== notificationId
      ).length;
      onUnreadCountChange?.(unreadCount);
    } catch (error) {
      console.error("Error marking as read:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [notificationId]: null }));
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    setActionLoading((prev) => ({ ...prev, all: "readAll" }));
    try {
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, all: null }));
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Notification",
      message: "Are you sure you want to delete this notification?",
      onConfirm: () => confirmDeleteNotification(notificationId),
    });
  };

  const confirmDeleteNotification = async (notificationId) => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setActionLoading((prev) => ({ ...prev, [notificationId]: "delete" }));
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );

      // Update count if it was unread
      const deletedNotif = notifications.find((n) => n._id === notificationId);
      if (deletedNotif && !deletedNotif.isRead) {
        const unreadCount = notifications.filter(
          (n) => !n.isRead && n._id !== notificationId
        ).length;
        onUnreadCountChange?.(unreadCount);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [notificationId]: null }));
    }
  };

  // Delete all notifications
  const handleDeleteAll = async () => {
    setConfirmModal({
      isOpen: true,
      title: "Delete All Notifications",
      message:
        "Are you sure you want to delete all notifications? This action cannot be undone.",
      onConfirm: () => confirmDeleteAll(),
    });
  };

  const confirmDeleteAll = async () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
    setActionLoading((prev) => ({ ...prev, all: "deleteAll" }));
    try {
      await deleteAllNotifications();
      setNotifications([]);
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, all: null }));
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      loadNotifications(currentPage + 1, false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US");
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-modal-overlay" onClick={onClose}>
      <div className="notifications-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-header">
          <h3>
            <FaBell className="header-icon" />
            Notifications
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="notifications-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
          <button
            className={filter === "read" ? "active" : ""}
            onClick={() => setFilter("read")}
          >
            Read
          </button>
        </div>

        <div className="notifications-actions">
          <button
            className="action-btn mark-all"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading["all"] === "readAll"}
          >
            <FaCheckDouble />
            {actionLoading["all"] === "readAll"
              ? "Marking..."
              : "Mark all read"}
          </button>
          <button
            className="action-btn delete-all"
            onClick={handleDeleteAll}
            disabled={actionLoading["all"] === "deleteAll"}
          >
            <FaTrash />
            {actionLoading["all"] === "deleteAll"
              ? "Deleting..."
              : "Delete all"}
          </button>
        </div>

        <div className="notifications-list">
          {loading && notifications.length === 0 ? (
            <div className="loading">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="empty-state">
              <FaBell className="empty-icon" />
              <p>No notifications found</p>
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
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
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default NotificationsModal;
