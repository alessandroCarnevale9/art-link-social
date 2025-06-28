const Notification = require("../models/NotificationModel");

async function notifyNewFollower(followerId, followeeId) {
  return Notification.create({
    userId: followeeId,
    type: "NewFollower",
    message: "You have a new follower!",
    fromUserId: followerId,
  });
}

module.exports = { notifyNewFollower };
