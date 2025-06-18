// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates the inputs for assigning a corrector to a task.
 * @param {string} task_id - The ID of the 'ASSIGN_CORRECTOR' task.
 * @param {string} corrector_id - The ID of the user being assigned as the corrector.
 * @param {Date|string} enter_marks_due_date - The due date for the new 'ENTER_MARKS' task.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
async function ValidateAssignCorrectorInput(task_id, corrector_id, enter_marks_due_date) {
    const isValidTaskId = mongoose.Types.ObjectId.isValid(task_id);
    if (!isValidTaskId) {
        throw new ApolloError(`Invalid task ID: ${task_id}`, "BAD_USER_INPUT");
    }

    const isValidCorrectorId = mongoose.Types.ObjectId.isValid(corrector_id);
    if (!isValidCorrectorId) {
        throw new ApolloError(`Invalid corrector ID: ${corrector_id}`, "BAD_USER_INPUT");
    }

    if (!(enter_marks_due_date instanceof Date ? !isNaN(enter_marks_due_date.getTime()) : !isNaN(new Date(enter_marks_due_date).getTime()))) {
        throw new ApolloError('A valid date of birth format is required.', 'BAD_USER_INPUT', {
            field: 'enter_marks_due_date'
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateAssignCorrectorInput,
}