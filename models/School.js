// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

const school_schema = mongoose.Schema({
    // School's name
    name: {
        type: String,
        required: true,
        trim: true
    },

    // School's address
    address: {
        type: String,
        trim: true
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

// *************** Defines the 'Student' model by compiling the school_schema.
const School = mongoose.model('School', school_schema);

// *************** EXPORT MODULE ***************
module.exports = School;