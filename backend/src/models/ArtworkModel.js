const mongoose = require("mongoose");
const { Schema } = mongoose;

require("./FavoriteModel");
require("./CommentModel");

const artworkSchema = new Schema(
  {
    externalId: {
      type: Number,
      unique: true,
      sparse: true,
    },

    /* --- dati principali --- */
    title: {
      type: String,
      required: true,
      trim: true,
    },
    primaryImage: String,
    primaryImageSmall: String,
    publishDate: Date,
    artworkPeriod: String,
    artworkCulture: String,
    linkResource: String,
    medium: String,
    dimensions: String,
    artistDisplayName: String,

    /* --- provenienza --- */
    origin: {
      type: String,
      enum: ["AdminUploaded", "UserUploaded", "MET"],
      required: true,
    },

    /* --- relazioni --- */
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artistId: {
      type: Schema.Types.ObjectId,
      ref: "Artist",
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    /* --- altre info --- */
    tags: [String],
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    /* --- contatori persistenti --- */
    favoritesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* ---------- VIRTUAL ---------- */
/* commenti */
artworkSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "artworkId",
  justOne: false,
});
artworkSchema.virtual("commentsCount").get(function () {
  return this.comments?.length ?? 0;
});

/* ---------- OUTPUT ---------- */
artworkSchema.set("toObject", { virtuals: true });
artworkSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Artwork", artworkSchema);
