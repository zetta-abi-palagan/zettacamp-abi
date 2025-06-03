// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const schoolSchema = mongoose.Schema({
    // School's name
    name: {
        type: String,
        required: true
    },

    // School's address
    address: {
        type: String,
        trim: true
    },

    student: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],

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
 * Finds and returns all active (not soft-deleted) schools.
 * @returns {Promise<School[]>} A promise that resolves to an array of active School documents.
 */
schoolSchema.statics.findActive = function() {
  return this.find({ deletedAt: null });
};

/**
 * Instance method.
 * Marks the current student document as soft-deleted by setting `deleted_at` to the current date,
 * then saves the changes to the database.
 * @returns {Promise<School>} A promise that resolves to the updated (soft-deleted) School document.
 */
schoolSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// *************** Defines the 'School' model by compiling the schoolSchema.
const School = mongoose.model('School', schoolSchema);

// *************** EXPORT MODULE ***************
module.exports = School;