const mongoose = require("mongoose");
const { Schema } = mongoose;

// 1) Schema base con i soli campi comuni
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

// 2) Schema “figlio” per gli utenti di tipo general
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
  },
  { timestamps: true }
);

// Virtual populate per relazioni follow
GeneralSchema.virtual("followers", {
  ref: "Follow", // Model Follow
  localField: "_id",
  foreignField: "followeeId",
  justOne: false,
});
GeneralSchema.virtual("following", {
  ref: "Follow", // Model Follow
  localField: "_id",
  foreignField: "followerId",
  justOne: false,
});

// Abilita virtuals in JSON e toObject
GeneralSchema.set("toObject", { virtuals: true });
GeneralSchema.set("toJSON", { virtuals: true });

// 3) Schema “figlio” per gli admin (no campi aggiuntivi)
const AdminSchema = new Schema({}, baseOptions);

// 4) Creazione dei model discriminati
const GeneralUser = User.discriminator("general", GeneralSchema);
const AdminUser = User.discriminator("admin", AdminSchema);

module.exports = {
  User,
  GeneralUser,
  AdminUser,
};
