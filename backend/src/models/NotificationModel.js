const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["NewComment", "NewLike", "NewFollower", "ReportResolved"],
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indici esistenti
notificationSchema.index({ userId: 1, isRead: 1 });

// NUOVO: Indice composto per prevenire duplicati e migliorare performance
notificationSchema.index({
  userId: 1,
  type: 1,
  fromUserId: 1,
  createdAt: -1,
});

// NUOVO: Indice per cleanup automatico delle notifiche vecchie
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 giorni

module.exports = mongoose.model("Notification", notificationSchema);
