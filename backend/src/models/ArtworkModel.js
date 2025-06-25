const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const artworkSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    publishDate: Date,
    artworkPeriod: String,
    artworkCulture: String,
    linkResource: String,
    medium: String,
    dimensions: String,
    origin: {
      type: String,
      enum: ["AdminUploaded", "UserUploaded"],
      required: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artistId: {
      type: Schema.Types.ObjectId,
      ref: "Artist",
    },
    tags: [String],
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Artwork", artworkSchema);
