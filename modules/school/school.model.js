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

    // Timestamp for soft delete
    deleted_at: {
        type: Date
    }
}, {
    // Automatically include createdAt and updatedAt fields
    timestamps: true
});

// *************** Defines a virtual 'students' field to populate active students linked by school_id.
schoolSchema.virtual('students', {
    ref: 'student',
    localField: '_id',
    foreignField: 'school_id',
    justOne: false,
    match: { deleted_at: null }
});

// *************** Ensures virtuals like 'students' are included when converting documents to JSON or objects.
schoolSchema.set('toJSON', { virtuals: true });
schoolSchema.set('toObject', { virtuals: true });

/**
 * Static method.
 * Finds and returns all active (not soft-deleted) schools.
 * @returns {Promise<School[]>} A promise that resolves to an array of active School documents.
 */
schoolSchema.statics.findActive = function () {
    return this.find({ deleted_at: null });
};

/**
 * Instance method.
 * Marks the current student document as soft-deleted by setting `deleted_at` to the current date,
 * then saves the changes to the database.
 * @returns {Promise<School>} A promise that resolves to the updated (soft-deleted) School document.
 */
schoolSchema.methods.softDelete = function () {
    this.deleted_at = new Date();
    return this.save();
};

// *************** Defines the 'school' model by compiling the schoolSchema.
const schoolModel = mongoose.model('school', schoolSchema);

// *************** EXPORT MODULE ***************
module.exports = schoolModel;