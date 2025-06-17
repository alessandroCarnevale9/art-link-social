const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const followSchema = new Schema({
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
});

module.exports = mongoose.model("Follow", followSchema);
