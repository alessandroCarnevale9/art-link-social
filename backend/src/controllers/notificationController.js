const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/ApiError");
const Notification = require("../models/NotificationModel");
const notificationService = require("../services/notificationService");

/**
 * GET /api/notifications
 * Ottiene tutte le notifiche dell'utente autenticato
 */
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const skip = (page - 1) * limit;
  const query = { userId };

  // Filtro per solo non lette se richiesto
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .populate("fromUserId", "firstName lastName profileImage")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .lean();

  // Conta il totale per la paginazione
  const total = await Notification.countDocuments(query);
  const totalPages = Math.ceil(total / limit);

  // Trasforma per il frontend
  const formattedNotifications = notifications.map((n) => ({
    ...n,
    fromUser: n.fromUserId,
    fromUserId: undefined,
  }));

  console.log(`Found ${notifications.length} notifications for user ${userId}`);

  res.json({
    notifications: formattedNotifications,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: total,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
});

/**
 * GET /api/notifications/unread-count
 * Ottiene il conteggio delle notifiche non lette
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const count = await Notification.countDocuments({
    userId,
    isRead: false,
  });

  res.json({ unreadCount: count });
});

/**
 * PUT /api/notifications/:id/read
 * Marca una notifica come letta
 */
const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const notificationId = req.params.id;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  ).populate("fromUserId", "firstName lastName profileImage");

  if (!notification) {
    throw new ApiError(404, "Notification not found.");
  }

  console.log(`Notification ${notificationId} marked as read by user ${userId}`);

  res.json({
    message: "Notification marked as read.",
    notification: {
      ...notification.toObject(),
      fromUser: notification.fromUserId,
      fromUserId: undefined,
    },
  });
});

/**
 * PUT /api/notifications/mark-all-read
 * Marca tutte le notifiche come lette
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const result = await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true }
  );

  console.log(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);

  res.json({
    message: "All notifications marked as read.",
    updatedCount: result.modifiedCount,
  });
});

/**
 * DELETE /api/notifications/:id
 * Elimina una notifica specifica
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const notificationId = req.params.id;

  const deleted = await Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });

  if (!deleted) {
    throw new ApiError(404, "Notification not found.");
  }

  console.log(`Notification ${notificationId} deleted by user ${userId}`);

  res.status(204).send();
});

/**
 * DELETE /api/notifications
 * Elimina tutte le notifiche dell'utente (opzionale)
 */
const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const result = await Notification.deleteMany({ userId });

  console.log(`Deleted ${result.deletedCount} notifications for user ${userId}`);

  res.json({
    message: "All notifications deleted.",
    deletedCount: result.deletedCount,
  });
});

/**
 * POST /api/notifications/cleanup
 * Pulisce le notifiche vecchie (solo per admin)
 */
const cleanupOldNotifications = asyncHandler(async (req, res) => {
  const userRole = req.userRole;

  if (userRole !== "admin") {
    throw new ApiError(403, "Admin access required.");
  }

  const { daysOld = 30 } = req.body;

  const result = await notificationService.cleanOldNotifications(daysOld);

  res.json({
    message: `Cleanup completed. Deleted ${result?.deletedCount || 0} old notifications.`,
    deletedCount: result?.deletedCount || 0,
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  cleanupOldNotifications,
};