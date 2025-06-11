// *************** IMPORT CORE ***************
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
        lowercase: true
    },

    // Student's hashed password for login
    password: {
        type: String,
        required: true
    },

    // Student's birth date
    date_of_birth: {
        type: Date,
        required: true
    },

    // URL or path to student's profile picture
    profile_picture: {
        type: String
    },

    // Current status of the student: ACTIVE, INACTIVE, or DELETED
    student_status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
        required: true
    },

    // ID of the school the student belongs to
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },

    // ID of the user who created this student record
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who last updated this student record
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who deleted this student (if applicable)
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Timestamp when the student was marked as deleted
    deleted_at: {
        type: Date
    }
}, {
    // Automatically include created_at and updated_at fields
    timestamps: {
        // Timestamp when the student record was created
        createdAt: 'created_at',
        // Timestamp when the student record was last updated
        updatedAt: 'updated_at'
    }
});

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('Student', studentSchema);