// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
    // Student's first name
    first_name: {
        type: String,
        required: true
    },

    // Student's last name
    last_name: {
        type: String,
        required: true
    },

    // Student's email address
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },

    // Student's date of birth
    date_of_birth: {
        type: Date
    },

    // Reference to the school the student belongs to
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
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
 * Finds and returns all active (not soft-deleted) students.
 * @returns {Promise<Student[]>} A promise that resolves to an array of active Student documents.
 */
studentSchema.statics.findActive = function() {
  return this.find({ deletedAt: null });
};

/**
 * Instance method.
 * Marks the current student document as soft-deleted by setting `deleted_at` to the current date,
 * then saves the changes to the database.
 * @returns {Promise<Student>} A promise that resolves to the updated (soft-deleted) Student document.
 */
studentSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// *************** Defines the 'Student' model by compiling the studentSchema.
const Student = mongoose.model('Student', studentSchema);

// *************** EXPORT MODULE ***************
module.exports = Student;