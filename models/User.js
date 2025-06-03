// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const user_schema = mongoose.Schema({
    // User's first name
    first_name: {
        type: String,
        required: true,
        trim: true
    },

    // User's last name
    last_name: {
        type: String,
        required: true,
        trim: true
    },

    // User's email address
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    // User's password (hashed)
    password: {
        type: String,
        required: true
    },

    // User's role in the system (e.g., admin, user)
    role: {
        type: String,
        required: true
    },

    // Timestamp for soft delete
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    // Automatically include createdAt and updatedAt fields
    timestamps: true
});

// *************** Defines the 'User' model by compiling the user_schema.
const User = mongoose.model('User', user_schema);

// *************** EXPORT MODULE ***************
module.exports = User;