// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const testConditionSchema = mongoose.Schema({
    // Type of the criteria: ‘MARK’ or ‘AVERAGE’
    criteria_type: {
        type: String,
        enum: ['MARK', 'AVERAGE']
    },

    // Reference to notation_text in notations field in test
    notation_text: {
        type: String,
    },

    // The comparison operator used in the criteria: 'GTE' (>=), 'LTE' (<=), 'GT' (>), 'LT' (<), 'E' (==)
    comparison_operator: {
        type: String,
        enum: ['GTE', 'LTE', 'GT', 'LT', 'E']
    },

    // The average of total test marks, or the mark of one test (depends on criteria_type)
    mark: {
        type: Number
    }
}, { _id: false });

const testCriteriaGroupSchema = mongoose.Schema({
    // An array of conditions, each object in condition will be checked by AND logical operator
    conditions: {
        type: [testConditionSchema]
    }
}, { _id: false });

const testCriteriaGroupListSchema = mongoose.Schema({
    // An array of criteria groups, each group will be checked by OR logical operator
    test_criteria_groups: {
        type: [testCriteriaGroupSchema]
    }
}, { _id: false });

const testPassingCriteriaSchema = mongoose.Schema({
    // Criteria for passing the test
    pass_criteria: {
        type: testCriteriaGroupListSchema
    },

    // Criteria for failing the test
    fail_criteria: {
        type: testCriteriaGroupListSchema
    },
}, { _id: false });

const testSchema = mongoose.Schema({
    // ID of the subject the test belongs to
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subject",
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

    // Type of the test: FREE CONTINUOUS CONTROL, MEMMOIRE ORAL NON JURY, MEMOIRE ORAL, MEMOIRE WRITTEN, MENTOR EVALUATION, ORAL, and WRITTEN
    test_type: {
        type: String,
        enum: ['FREE_CONTINUOUS_CONTROL', 'MEMMOIRE_ORAL_NON_JURY', 'MEMOIRE_ORAL', 'MEMOIRE_WRITTEN', 'MENTOR_EVALUATION', 'ORAL', 'WRITTEN'],
        required: true
    },

    // How is the result of the test visible to student: NEVER, AFTER CORRECTION, AFTER JURY DECISION FOR FINAL TRANSCRIPT
    result_visibility: {
        type: String,
        enum: ['NEVER', 'AFTER_CORRECTION', 'AFTER_JURY_DECISION_FOR_FINAL_TRANSCRIPT'],
        required: true
    },

    // The weight of the test's score in the final subject calculation (e.g., 0.3 for 30%)
    weight: {
        type: Number,
        required: true,
        min: 0
    },

    // How the test is corrected: ADMTC, CERTIFIER, ACADEMIC CORRECTOR, PREPARATION CENTER
    correction_type: {
        type: String,
        enum: ['ADMTC', 'CERTIFIER', 'CROSS_CORRECTION', 'PREPARATION_CENTER'],
        required: true
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
            required: true,
            min: 0
        }
    }],

    // Check if this test is retake or not
    is_retake: {
        type: Boolean,
        required: true
    },

    // The test that this test is retake for (only for retake by test)
    connected_test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "test"
    },

    // Current status of the test: ACTIVE, INACTIVE, or DELETED
    test_status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
        required: true
    },

    // Rules for passing the test using logical conditions on notation performance
    test_passing_criteria: {
        type: testPassingCriteriaSchema
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

    //  ID of the user that published this test
    published_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },

    // Timestamp for when the test is due
    test_due_date: {
        type: Date
    },

    //  List of student test result's IDs associated with this test
    student_test_results: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student_test_result'
    }],

    //  List of task's IDs associated with this test
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'task'
    }],

    // ID of the user who created this test record
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    // ID of the user who last updated this test record
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    // ID of the user who deleted this test (if applicable)
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
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

const TestModel = mongoose.model('test', testSchema);

// *************** EXPORT MODULE ***************
module.exports = TestModel;