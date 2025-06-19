// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates that the provided input is a non-array object.
 * @param {object} input - The input variable to be validated.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateInputTypeObject(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('Input must be a valid object');
    }
}

/**
 * Validates the optional task_status input for fetching all tasks.
 * @param {string} task_status - The status of the tasks to filter by (e.g., 'PENDING').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetAllTasksInput(task_status) {
    const validStatus = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELETED'];

    if (!task_status) {
        return;
    }

    if (typeof task_status !== 'string' || !validStatus.includes(task_status.toUpperCase())) {
        throw new ApolloError(`Task status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'task_status'
        });
    }
}

/**
 * Validates the inputs for assigning a corrector to a task.
 * @param {string} task_id - The ID of the 'ASSIGN_CORRECTOR' task.
 * @param {string} corrector_id - The ID of the user being assigned as the corrector.
 * @param {Date|string} enter_marks_due_date - The due date for the new 'ENTER_MARKS' task.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateAssignCorrectorInput(task_id, corrector_id, enter_marks_due_date) {
    const isValidTaskId = mongoose.Types.ObjectId.isValid(task_id);
    if (!isValidTaskId) {
        throw new ApolloError(`Invalid task ID: ${task_id}`, "BAD_USER_INPUT");
    }

    const isValidCorrectorId = mongoose.Types.ObjectId.isValid(corrector_id);
    if (!isValidCorrectorId) {
        throw new ApolloError(`Invalid corrector ID: ${corrector_id}`, "BAD_USER_INPUT");
    }

    if (!(enter_marks_due_date instanceof Date ? !isNaN(enter_marks_due_date.getTime()) : !isNaN(new Date(enter_marks_due_date).getTime()))) {
        throw new ApolloError('A valid date format is required.', 'BAD_USER_INPUT', {
            field: 'enter_marks_due_date'
        });
    }
}

/**
 * Validates all inputs required for the 'enter marks' workflow.
 * @param {string} task_id - The ID of the 'ENTER_MARKS' task.
 * @param {string} test - The ID of the related test.
 * @param {string} student - The ID of the related student.
 * @param {Array<object>} marks - A non-empty array of mark objects to be validated.
 * @param {Date|string} validate_marks_due_date - The due date for the subsequent 'VALIDATE_MARKS' task.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateEnterMarksInput(task_id, test, student, marks, validate_marks_due_date) {
    const isValidTaskId = mongoose.Types.ObjectId.isValid(task_id);
    if (!isValidTaskId) {
        throw new ApolloError(`Invalid task ID: ${test}`, "BAD_USER_INPUT");
    }

    const isValidTestId = mongoose.Types.ObjectId.isValid(test);
    if (!isValidTestId) {
        throw new ApolloError(`Invalid test ID: ${test}`, "BAD_USER_INPUT");
    }

    const isValidStudentId = mongoose.Types.ObjectId.isValid(student);
    if (!isValidStudentId) {
        throw new ApolloError(`Invalid student ID: ${student}`, "BAD_USER_INPUT");
    }

    if (!Array.isArray(marks) || !marks.length) {
        throw new ApolloError('Notations must be a non-empty array.', 'BAD_USER_INPUT', {
            field: 'marks'
        });
    }

    for (const [index, notation] of marks.entries()) {
        const { notation_text, mark } = notation;

        if (!notation_text || typeof notation_text !== 'string' || notation_text.trim() === '') {
            throw new ApolloError(`Notation at index ${index} must have non-empty text.`, 'BAD_USER_INPUT', {
                field: `notations[${index}].notation_text`
            });
        }

        if (typeof mark !== 'number' || isNaN(mark) || mark < 0) {
            throw new ApolloError(`Notation at index ${index} must have a valid mark (number ≥ 0).`, 'BAD_USER_INPUT', {
                field: `notations[${index}].mark`
            });
        }
    }

    if (!(validate_marks_due_date instanceof Date ? !isNaN(validate_marks_due_date.getTime()) : !isNaN(new Date(validate_marks_due_date).getTime()))) {
        throw new ApolloError('A valid date format is required.', 'BAD_USER_INPUT', {
            field: 'validate_marks_due_date'
        });
    }
}

/**
 * Validates the IDs for the 'validate marks' workflow.
 * @param {string} task_id - The ID of the 'VALIDATE_MARKS' task.
 * @param {string} student_test_result_id - The ID of the student test result.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateValidateMarksInput(task_id, student_test_result_id) {
    const isValidTaskId = mongoose.Types.ObjectId.isValid(task_id);
    if (!isValidTaskId) {
        throw new ApolloError(`Invalid task ID: ${task_id}`, "BAD_USER_INPUT");
    }

    const isValidStudentTestResultId = mongoose.Types.ObjectId.isValid(student_test_result_id);
    if (!isValidStudentTestResultId) {
        throw new ApolloError(`Invalid student test result ID: ${student_test_result_id}`, "BAD_USER_INPUT");
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateInputTypeObject,
    ValidateGetAllTasksInput,
    ValidateAssignCorrectorInput,
    ValidateEnterMarksInput,
    ValidateValidateMarksInput
}