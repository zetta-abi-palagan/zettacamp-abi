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

    // Student's date of birth
    date_of_birth: {
        type: Date
    },

    // Reference to the school the student belongs to
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'school',
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

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('student', studentSchema);