const mongoose = require("mongoose");
const { Schema } = mongoose;

// 1) schema base con i soli campi comuni
const baseOptions = {
  discriminatorKey: "role", // il campo che distingue i tipi
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
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["general", "admin"],
      required: true,
      default: "general",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  baseOptions
);

const User = mongoose.model("User", BaseUserSchema);

// 2) schema “figlio” per gli utenti di tipo general
const GeneralSchema = new Schema({
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
  bio: {
    type: String,
    trim: true,
    maxlength: 160,
    default: "",
  },
  profileImage: {
    type: String,
    trim: true,
  },
  artworks: [{ type: Schema.Types.ObjectId, ref: "Artwork" }],
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  likedArtworks: [{ type: Schema.Types.ObjectId, ref: "Artwork" }],
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  notifications: [{ type: Schema.Types.ObjectId, ref: "Notification" }],
  reports: [{ type: Schema.Types.ObjectId, ref: "Report" }],
});

// 3) schema “figlio” per gli admin (non aggiunge nulla)
const AdminSchema = new Schema({});

// 4) crei i due modelli discriminati
const GeneralUser = User.discriminator("general", GeneralSchema);
const AdminUser = User.discriminator("admin", AdminSchema);

module.exports = { User, GeneralUser, AdminUser };
