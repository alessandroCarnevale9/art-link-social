const Notification = require("../models/NotificationModel");

async function notifyNewFollower(followerId, followeeId) {
  return Notification.create({
    userId: followeeId,
    type: "NewFollower",
    message: "Hai un nuovo follower!",
    fromUserId: followerId,
  });
}

module.exports = { notifyNewFollower };
