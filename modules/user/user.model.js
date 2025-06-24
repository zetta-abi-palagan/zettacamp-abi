// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    // User's first name
    first_name: {
        type: String,
        required: true
    },

    // User's last name
    last_name: {
        type: String,
        required: true
    },

    // User's email address
    email: {
        type: String,
        required: true,
        lowercase: true
    },

    // User's hashed password for authentication
    password: {
        type: String,
        required: true
    },

    // User's role in the system, either ADMIN, USER, ACADEMIC_DIRECTOR, or CORRECTOR
    role: {
        type: String,
        enum: ['ADMIN', 'USER', 'ACADEMIC_DIRECTOR', 'CORRECTOR'],
        required: true
    },

    // URL or path to user's profile picture
    profile_picture: {
        type: String
    },

    // Current status of the user: ACTIVE, INACTIVE, or DELETED
    user_status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
        required: true
    },

    // ID of the user who created this user record
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    // ID of the user who last updated this user record
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    // ID of the user who deleted this user (if applicable)
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },

    // Timestamp when the user was marked as deleted
    deleted_at: {
        type: Date
    }
}, {
    // Automatically include created_at and updated_at fields
    timestamps: {
        // Timestamp when the user record was created
        createdAt: 'created_at',
        // Timestamp when the user record was last updated
        updatedAt: 'updated_at'
    }
});

const UserModel = mongoose.model('User', userSchema);

// *************** EXPORT MODULE ***************
module.exports = UserModel;