// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const subjectSchema = mongoose.Schema({
    // ID of the block the subject belongs to
    block: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Block",
        required: true
    },

    // Subject’s name
    name: {
        type: String,
        required: true
    },

    // A detailed description of the subject's curriculum and goals
    description: {
        type: String,
        required: true
    },

    // The coefficient used as a calculation factor for the subject's overall importance or grading
    coefficient: {
        type: Number,
        required: true,
        min: 0
    },

    // Check if this is a subject in transversal block or not
    is_transversal: {
        type: Boolean,
        required: true
    },

    // List of blocks that are connected to this subject (only for subject in transversal block)
    connected_blocks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Block"
    }],

    // List of test IDs associated with the subject
    tests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test"
    }],

    // Current status of the subject: ACTIVE, INACTIVE, or DELETED
    subject_status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
        required: true
    },

    // ID of the user who created this subject record
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who last updated this subject record
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who deleted this subject (if applicable)
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Timestamp when the subject was marked as deleted
    deleted_at: {
        type: Date
    }
}, {
    // Automatically include created_at and updated_at fields
    timestamps: {
        // Timestamp when the subject record was created
        createdAt: 'created_at',
        // Timestamp when the subject record was last updated
        updatedAt: 'updated_at'
    }
});

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('Subject', subjectSchema);