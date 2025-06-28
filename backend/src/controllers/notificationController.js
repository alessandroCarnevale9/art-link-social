const asyncHandler = require("express-async-handler");
const Notification = require("../models/NotificationModel");

exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const notes = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  res.json(notes);
});
