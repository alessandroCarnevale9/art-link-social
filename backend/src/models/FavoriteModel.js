const mongoose = require("mongoose");
const { Schema } = mongoose;

const favoriteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artwork: {
      type: Schema.Types.ObjectId,
      ref: "Artwork",
      required: true,
    },
  },
  { timestamps: true }
);

// indice unico per evitare duplicati
favoriteSchema.index({ user: 1, artwork: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
