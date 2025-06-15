const mongoose = require(`mongoose`)
const Schema = mongoose.Schema

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: [`general`, `admin`],
        default: `general` 
    },
    isActive: {
        type: Boolean,
        default: true
    },

    artworks: [{ type: Schema.Types.ObjectId, ref: 'Artwork' }],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    likedArtworks: [{ type: Schema.Types.ObjectId, ref: 'Artwork' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    notifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
    reports: [{ type: Schema.Types.ObjectId, ref: 'Report' }]

}, { timestamps: true }
)

const User = mongoose.model(`User`, userSchema)
module.exports = User
