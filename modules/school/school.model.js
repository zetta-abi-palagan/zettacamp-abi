// *************** IMPORT CORE ***************
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

    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "student"
    }],

    // Timestamp for soft delete
    deleted_at: {
        type: Date
    }
}, {
    // Automatically include createdAt and updatedAt fields
    timestamps: true
});

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('school', schoolSchema);