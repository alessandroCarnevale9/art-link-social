// src/models/UserModel.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const baseOptions = {
  discriminatorKey: "role",
  collection: "users",
  timestamps: true,
};

const BaseUserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["general", "admin"],
      required: true,
      default: "general",
    },
    isActive: { type: Boolean, default: true },
  },
  baseOptions
);

const User = mongoose.model("User", BaseUserSchema);

// General user schema (senza più likedArtworks)
const GeneralSchema = new Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: true,
      minlength: 2,
      maxlength: 30,
    },
    lastName: {
      type: String,
      trim: true,
      required: true,
      minlength: 2,
      maxlength: 30,
    },
    bio: { type: String, trim: true, maxlength: 160, default: "" },
    profileImage: { type: String, trim: true },
    // <-- likedArtworks rimosso, gestito ora tramite FavoriteModel
  },
  { timestamps: true }
);

// Virtual populate per relazioni follow
GeneralSchema.virtual("followers", {
  ref: "Follow",
  localField: "_id",
  foreignField: "followeeId",
  justOne: false,
});
GeneralSchema.virtual("following", {
  ref: "Follow",
  localField: "_id",
  foreignField: "followerId",
  justOne: false,
});

GeneralSchema.set("toObject", { virtuals: true });
GeneralSchema.set("toJSON", { virtuals: true });

const AdminSchema = new Schema({}, baseOptions);

const GeneralUser = User.discriminator("general", GeneralSchema);
const AdminUser = User.discriminator("admin", AdminSchema);

module.exports = { User, GeneralUser, AdminUser };
