const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: String,
  },
  {
    timestamps: true,
  }
);

// virtual populate per Artwork
categorySchema.virtual("artworks", {
  ref: "Artwork",
  localField: "_id",
  foreignField: "categories",
  justOne: false,
});

categorySchema.set("toObject", { virtuals: true });
categorySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Category", categorySchema);
