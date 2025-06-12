// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const blockSchema = mongoose.Schema({
    // Block’s name
    name: {
        type: String,
        required: true
    },

    // Block’s description
    description: {
        type: String,
        required: true
    },

    // Type of the evaluation: COMPETENCY or SCORE
    evaluation_type: {
        type: String,
        enum: ['COMPETENCY', 'SCORE'],
        required: true
    },

    // Type of the block: REGULAR, COMPETENCY, SOFT_SKILL, ACADEMIC_RECOMMENDATION, SPECIALIZATION, TRANSVERSAL, RETAKE
    block_type: {
        type: String,
        enum: ['REGULAR', 'COMPETENCY', 'SOFT_SKILL', 'ACADEMIC_RECOMMENDATION', 'SPECIALIZATION', 'TRANSVERSAL', 'RETAKE'],
        required: true
    },

    // Other block that is connected to this block, only for block type: RETAKE
    connected_block: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Block"
    },

    // Check whether the block is counted in the final transcript or not
    is_counted_in_final_transcript: {
        type: Boolean,
        required: true
    },

    // List of subject IDs associated with the block
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject"
    }],

    // Current status of the block: ACTIVE, INACTIVE, or DELETED
    block_status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
        required: true
    },

    // ID of the user who created this block record
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who last updated this block record
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who deleted this block (if applicable)
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Timestamp when the block was marked as deleted
    deleted_at: {
        type: Date
    }
}, {
    // Automatically include created_at and updated_at fields
    timestamps: {
        // Timestamp when the block record was created
        createdAt: 'created_at',
        // Timestamp when the block record was last updated
        updatedAt: 'updated_at'
    }
});

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('Block', blockSchema);