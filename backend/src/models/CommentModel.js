const mongoose = require("mongoose");
const { Schema } = mongoose;

const commentSchema = new Schema(
  {
    artworkId: {
      type: Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per migliorare le performance delle query
commentSchema.index({ artworkId: 1 });
commentSchema.index({ authorId: 1 });

module.exports = mongoose.model("Comment", commentSchema);
