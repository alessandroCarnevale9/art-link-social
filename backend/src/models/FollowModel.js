const mongoose = require("mongoose");
const { Schema } = mongoose;

const followSchema = new Schema(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // timestamps aggiuntivi: createdAt e updatedAt
    timestamps: true,
  }
);

// Indice unico per evitare duplicati (un follower non può seguire due volte lo stesso followee)
followSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });

module.exports = mongoose.model("Follow", followSchema);
