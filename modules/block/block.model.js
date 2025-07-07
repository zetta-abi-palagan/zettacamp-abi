// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const blockCriteriaGroupListSchema = mongoose.Schema({
    // An array of criteria groups, each group will be checked by OR logical operator
    block_criteria_groups: [{
        // An array of conditions, each object in condition will be checked by AND logical operator
        conditions: [{
            // Type of the criteria: ‘MARK’ or ‘AVERAGE’
            criteria_type: {
                type: String,
                enum: ['MARK', 'AVERAGE']
            },

            // Reference to subject that is part of the condition to pass the block
            subject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "subject"
            },

            // The comparison operator used in the criteria: 'GTE' (>=), 'LTE' (<=), 'GT' (>), 'LT' (<), 'E' (==)
            comparison_operator: {
                type: String,
                enum: ['GTE', 'LTE', 'GT', 'LT', 'E']
            },

            // The average of total subject marks, or the mark of one subject (depends on criteria_type)
            mark: {
                type: Number
            }
        }]
    }]
}, { _id: false });

const blockPassingCriteriaSchema = mongoose.Schema({
    // Criteria for passing the block
    pass_criteria: {
        type: blockCriteriaGroupListSchema
    },

    // Criteria for failing the block
    fail_criteria: {
        type: blockCriteriaGroupListSchema
    },
}, { _id: false });

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
        ref: "block"
    },

    // Check whether the block is counted in the final transcript or not
    is_counted_in_final_transcript: {
        type: Boolean,
        required: true
    },

    // List of subject IDs associated with the block
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject"
    }],

    // Current status of the block: ACTIVE, INACTIVE, or DELETED
    block_status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
        required: true
    },

    // Rules for passing the block using logical conditions on subject performance
    block_passing_criteria: {
        type: blockPassingCriteriaSchema
    },

    // ID of the user who created this block record
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    // ID of the user who last updated this block record
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    // ID of the user who deleted this block (if applicable)
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
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

const BlockModel = mongoose.model('block', blockSchema);

// *************** EXPORT MODULE ***************
module.exports = BlockModel;