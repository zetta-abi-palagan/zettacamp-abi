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
        type: Date
    }
}, {
    // Automatically include createdAt and updatedAt fields
    timestamps: true
});



// *************** Defines the 'user' model by compiling the userSchema.
const userModel = mongoose.model('user', userSchema);

// *************** EXPORT MODULE ***************
module.exports = userModel;