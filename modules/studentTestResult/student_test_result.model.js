// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const studentTestResultSchema = mongoose.Schema({
    // The ID of the student to whom the test result belongs
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },

    // The ID of the test to which the test result belongs
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },

    // An array of grading criteria objects, where each object contains notation_text (String, Required) and mark (Number, Required)
    marks: [{
        // The description or label for the grading criterion
        notation_text: {
            type: String,
            required: true
        },

        // Score for the notation
        mark: {
            type: Number,
            required: true
        }
    }],

    // The average of the total of marks
    average_mark: {
        type: Number,
        required: true
    },

    // Timestamp for when the mark is entered
    mark_entry_date: {
        type: Date,
        required: true
    },

    // Current status of the student test result: PENDING, VALIDATED, and DELETED
    student_test_result_status: {
        type: String,
        enum: ['PENDING', 'VALIDATED', 'DELETED'],
        required: true
    },

    // ID of the user who created this student test result record
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who last updated this student test result record
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who deleted this student test result (if applicable)
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Timestamp when the student test result was marked as deleted
    deleted_at: {
        type: Date
    }
}, {
    // Automatically include created_at and updated_at fields
    timestamps: {
        // Timestamp when the student test result record was created
        createdAt: 'created_at',
        // Timestamp when the student test result record was last updated
        updatedAt: 'updated_at'
    }
});

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('StudentTestResult', studentTestResultSchema);