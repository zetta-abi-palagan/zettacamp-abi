// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const testSchema = mongoose.Schema({
    // ID of the block the subject belongs to
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },

    // Test’s name
    name: {
        type: String,
        required: true
    },

    // A detailed description of the test's content and instructions
    description: {
        type: String,
        required: true
    },

    // The weight of the test's score in the final subject calculation (e.g., 0.3 for 30%)
    weight: {
        type: Number,
        required: true,
        min: 0
    },

    // An array of grading criteria objects, where each object contains notation_text and max_points
    notations: [{
        // The description or label for the grading criterion
        notation_text: {
            type: String,
            required: true
        },
        // The maximum score that can be awarded for this criterion
        max_points: {
            type: Number,
            required: true
        }
    }],

    // Current status of the test: ACTIVE, INACTIVE, or DELETED
    test_status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
        required: true
    },

    // Published status of the test
    is_published: {
        type: Boolean,
        required: true,
        default: false
    },

    // Timestamp when the test is published and made active
    published_date: {
        type: Date
    },

    // ID of the user who created this test record
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who last updated this test record
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who deleted this test (if applicable)
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Timestamp when the test was marked as deleted
    deleted_at: {
        type: Date
    }
}, {
    // Automatically include created_at and updated_at fields
    timestamps: {
        // Timestamp when the test record was created
        createdAt: 'created_at',
        // Timestamp when the test record was last updated
        updatedAt: 'updated_at'
    }
});

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('Test', testSchema);