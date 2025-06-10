// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const schoolSchema = mongoose.Schema({
    // School's public or brand name
    commercial_name: {
        type: String,
        required: true
    },

    // Official registered name of the school
    legal_name: {
        type: String,
        required: true
    },

    // Full address of the school
    address: {
        type: String,
        required: true
    },

    // City where the school is located
    city: {
        type: String,
        required: true
    },

    // Country where the school operates
    country: {
        type: String,
        required: true
    },

    // Postal code of the school's location
    zipcode: {
        type: Date,
        required: true
    },

    // URL or path to the school's logo
    logo: {
        type: String
    },

    // Current status of the school: ACTIVE, INACTIVE, or DELETED
    school_status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
        required: true
    },

    // List of student IDs associated with the school
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }],

    // ID of the user who created this school record
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who last updated this school record
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who deleted this school (if applicable)
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Timestamp when the school was marked as deleted
    deleted_at: {
        type: Date
    }
}, {
    // Automatically include created_at and updated_at fields
    timestamps: {
        // Timestamp when the school record was created
        createdAt: 'created_at',
        // Timestamp when the school record was last updated
        updatedAt: 'updated_at'
    }
});

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('School', schoolSchema);