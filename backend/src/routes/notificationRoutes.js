const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");
const ctrl = require("../controllers/notificationController");

// Middleware di autenticazione per tutte le route
router.use(verifyJWT);

// GET /api/notifications - Lista notifiche con paginazione e filtri
router.get("/", ctrl.getNotifications);

// GET /api/notifications/unread-count - Conteggio notifiche non lette
router.get("/unread-count", ctrl.getUnreadCount);

// PUT /api/notifications/mark-all-read - Marca tutte come lette
router.put("/mark-all-read", ctrl.markAllAsRead);

// PUT /api/notifications/:id/read - Marca singola notifica come letta
router.put("/:id/read", ctrl.markAsRead);

// DELETE /api/notifications/all - Elimina tutte le notifiche dell'utente
router.delete("/all", ctrl.deleteAllNotifications);

// POST /api/notifications/cleanup - Pulizia notifiche vecchie (solo admin)
router.post("/cleanup", ctrl.cleanupOldNotifications);

// DELETE /api/notifications/:id - Elimina singola notifica
router.delete("/:id", ctrl.deleteNotification);

module.exports = router;
