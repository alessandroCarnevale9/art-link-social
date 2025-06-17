const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reportSchema = new Schema({
  reporterId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetType: {
    type: String,
    enum: ["Artwork", "Comment"],
    required: true,
  },
  targetId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  reasonType: {
    type: String,
    enum: [
      "spam",
      "inappropriate_content",
      "privacy_violation",
      "intellectual_property",
      "other",
    ],
    required: true,
  },
  otherReason: String,
  status: {
    type: String,
    enum: ["Open", "Resolved", "Ignored"],
    default: "Open",
  },
  reportedAt: {
    type: Date,
    default: Date.now,
  },
  handledBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  handledAt: Date,
});

module.exports = mongoose.model("Report", reportSchema);
