const Notification = require("../models/NotificationModel");

async function notifyNewFollower(followerId, followeeId) {
  return Notification.create({
    userId: followeeId,
    type: "NewFollower",
    message: "You have a new follower!",
    fromUserId: followerId,
  });
}

async function notifyNewComment(commenterId, artworkOwnerId, artworkId) {
  return Notification.create({
    userId: artworkOwnerId,
    type: "NewComment",
    message: "Someone commented on your artwork.",
    fromUserId: commenterId,
  });
}

module.exports = {
  notifyNewFollower,
  notifyNewComment,
};
