// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const finalTranscriptResultSchema = mongoose.Schema(
  {
    // Reference to student model that have this final transcript
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'student',
      required: true,
    },

    // 'PASS' or 'FAIL' for a student, student can be decided as 'PASS' if all blocks also 'PASS'
    overall_result: {
      type: String,
      enum: ['PASS', 'FAIL'],
      required: true,
    },

    // Array of BlockResult object
    block_results: [
      {
        // Reference to Block model
        block: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'block',
          required: true,
        },

        // ‘PASS’ or ‘FAIL’ for a block, block can be decided as ‘PASS’ if the block criteria condition achieved
        block_result: {
          type: String,
          enum: ['PASS', 'FAIL'],
          required: true,
        },

        // Total mark of a block, comes from the block’s average total subject marks
        block_total_mark: {
          type: Number,
          required: true,
        },

        // Array of SubjectResult object
        subject_results: [
          {
            // Reference to Subject model
            subject: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'subject',
              required: true,
            },

            // ‘PASS’ or ‘FAIL’ for a subject, subject can be decided as ‘PASS’ if the subject criteria condition achieved
            subject_result: {
              type: String,
              enum: ['PASS', 'FAIL'],
              required: true,
            },

            // Total mark of a subject, comes from the subject’s average total test marks
            subject_total_mark: {
              type: Number,
              required: true,
            },

            // Array of TestResult object
            test_results: [
              {
                // Reference to Test model
                test: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'test',
                  required: true,
                },

                // ‘PASS’ or ‘FAIL’ for a test, test can be decided as ‘PASS’ if the test criteria condition achieved
                test_result: {
                  type: String,
                  enum: ['PASS', 'FAIL'],
                  required: true,
                },

                // Total mark of a test, comes from the test’s average total notation marks
                test_total_mark: {
                  type: Number,
                  required: true,
                },

                // Mark after applying the test’s weight
                test_weighted_mark: {
                  type: Number,
                  required: true,
                },
              },
            ],
          },
        ],
      },
    ],

    // Reference to user that created this final transcript result
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },

    // Reference to user that updated this final transcript result
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
  },
  {
    // Automatically include created_at and updated_at fields
    timestamps: {
      // Timestamp for when the FinalTranscriptResult is created
      createdAt: 'created_at',
      // Timestamp for when the FinalTranscriptResult is created
      updatedAt: 'updated_at',
    },
  }
);

const FinalTranscriptResultModel = mongoose.model('final_transcript_result', finalTranscriptResultSchema);

// *************** EXPORT MODULE ***************
module.exports = FinalTranscriptResultModel;
