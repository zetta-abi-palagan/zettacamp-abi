// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const student_schema = mongoose.Schema({
    // Student's first name
    first_name: {
        type: String,
        required: true,
        trim: true
    },

    // Student's last name
    last_name: {
        type: String,
        required: true,
        trim: true
    },

    // Student's email address
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
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
        type: Date,
        default: null
    }
}, {
    // Automatically include createdAt and updatedAt fields
    timestamps: true
});

// *************** Defines the 'Student' model by compiling the student_schema.
const Student = mongoose.model('Student', student_schema);

// *************** EXPORT MODULE ***************
module.exports = Student;