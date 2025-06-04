// *************** IMPORT LIBRARY ***************
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
        unique: true,
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

/**
 * Static method.
 * Finds and returns all active (not soft-deleted) users.
 * @returns {Promise<User[]>} A promise that resolves to an array of active User documents.
 */
userSchema.statics.findActive = function() {
  return this.find({ deleted_at: null });
};

/**
 * Instance method.
 * Marks the current user document as soft-deleted by setting `deleted_at` to the current date,
 * then saves the changes to the database.
 * @returns {Promise<User>} A promise that resolves to the updated (soft-deleted) User document.
 */
userSchema.methods.softDelete = function() {
  this.deleted_at = new Date();
  return this.save();
};

// *************** Defines the 'user' model by compiling the userSchema.
const userModel = mongoose.model('user', userSchema);

// *************** EXPORT MODULE ***************
module.exports = userModel;