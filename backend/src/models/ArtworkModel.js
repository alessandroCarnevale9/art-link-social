const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require("./FavoriteModel");
require("./CommentModel");

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

// Virtual populate per i commenti
artworkSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "artworkId",
  justOne: false,
});

// Virtual populate per i favoriti
artworkSchema.virtual("favorites", {
  ref: "Favorite", // o il model che usi per le preferenze
  localField: "_id",
  foreignField: "artwork",
  justOne: false,
});

// Virtual counts
artworkSchema.virtual("commentsCount").get(function () {
  return this.comments?.length ?? 0;
});
artworkSchema.virtual("favoritesCount").get(function () {
  return this.favorites?.length ?? 0;
});

// Abilita i virtual anche in toJSON
artworkSchema.set("toObject", { virtuals: true });
artworkSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Artwork", artworkSchema);
