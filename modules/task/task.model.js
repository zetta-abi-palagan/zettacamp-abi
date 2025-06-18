// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    // The ID of the test to which the task belongs
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },

    // The ID of the user to which the task belongs
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Title of the task
    title: {
        type: String,
        required: true
    },

    // Description of the task
    description: {
        type: String,
        required: true
    },

    // Type of the task: assign corrector (academic director), enter marks (corrector), and validate marks (academic director)
    task_type: {
        type: String,
        enum: ['ASSIGN_CORRECTOR', 'ENTER_MARKS', 'VALIDATE_MARKS'],
        required: true
    },

    // Current status of the test: pending, in progress, and completed
    task_status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
        required: true
    },

    // Due date for the task
    due_date: {
        type: Date,
    },

    // The ID of user that completed this task
    completed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Timestamp for when this task was completed
    completed_at: {
        type: Date
    },

    // ID of the user who created this task record
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who last updated this task record
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // ID of the user who deleted this task (if applicable)
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Timestamp when the task was marked as deleted
    deleted_at: {
        type: Date
    }
}, {
    // Automatically include created_at and updated_at fields
    timestamps: {
        // Timestamp when the task record was created
        createdAt: 'created_at',
        // Timestamp when the task record was last updated
        updatedAt: 'updated_at'
    }
});

// *************** EXPORT MODULE ***************
module.exports = mongoose.model('Task', taskSchema);