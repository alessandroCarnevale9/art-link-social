const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const artistSchema = new Schema(
  {
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    displayBio: String,
    birthDate: String,
    deathDate: String,
    nationality: String,
    wikiUrl: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Artist", artistSchema);
