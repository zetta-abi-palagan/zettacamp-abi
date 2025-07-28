// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const subjectCriteriaGroupListSchema = mongoose.Schema(
  {
    // An array of criteria groups, each group will be checked by OR logical operator
    subject_criteria_groups: [
      {
        // An array of conditions, each object in condition will be checked by AND logical operator
        conditions: [
          {
            // Type of the criteria: ‘MARK’ or ‘AVERAGE’
            criteria_type: {
              type: String,
              enum: ['MARK', 'AVERAGE'],
            },

            // Reference to test that is part of the condition to pass the subject
            test: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'test',
            },

            // The comparison operator used in the criteria: 'GTE' (>=), 'LTE' (<=), 'GT' (>), 'LT' (<), 'E' (==)
            comparison_operator: {
              type: String,
              enum: ['GTE', 'LTE', 'GT', 'LT', 'E'],
            },

            // The average of total test marks, or the mark of one test (depends on criteria_type)
            mark: {
              type: Number,
            },
          },
        ],
      },
    ],
  },
  { _id: false }
);

const subjectPassingCriteriaSchema = mongoose.Schema(
  {
    // Criteria for passing the subject
    pass_criteria: {
      type: subjectCriteriaGroupListSchema,
    },

    // Criteria for failing the subject
    fail_criteria: {
      type: subjectCriteriaGroupListSchema,
    },
  },
  { _id: false }
);

const subjectSchema = mongoose.Schema(
  {
    // ID of the block the subject belongs to
    block: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'block',
      required: true,
    },

    // Subject’s name
    name: {
      type: String,
      required: true,
    },

    // A detailed description of the subject's curriculum and goals
    description: {
      type: String,
      required: true,
    },

    // The coefficient used as a calculation factor for the subject's overall importance or grading
    coefficient: {
      type: Number,
      required: true,
      min: 0,
    },

    // Check if this is a subject in transversal block or not
    is_transversal: {
      type: Boolean,
      required: true,
    },

    // List of blocks that are connected to this subject (only for subject in transversal block)
    connected_blocks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'block',
      },
    ],

    // List of test IDs associated with the subject
    tests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'test',
      },
    ],

    // Current status of the subject: ACTIVE, INACTIVE, or DELETED
    subject_status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
      required: true,
    },

    // Rules for passing the subject using logical conditions on test performance
    subject_passing_criteria: {
      type: subjectPassingCriteriaSchema,
    },

    // ID of the user who created this subject record
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    // ID of the user who last updated this subject record
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    // ID of the user who deleted this subject (if applicable)
    deleted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
    },

    // Timestamp when the subject was marked as deleted
    deleted_at: {
      type: Date,
    },
  },
  {
    // Automatically include created_at and updated_at fields
    timestamps: {
      // Timestamp when the subject record was created
      createdAt: 'created_at',
      // Timestamp when the subject record was last updated
      updatedAt: 'updated_at',
    },
  }
);

const SubjectModel = mongoose.model('subject', subjectSchema);

// *************** EXPORT MODULE ***************
module.exports = SubjectModel;
