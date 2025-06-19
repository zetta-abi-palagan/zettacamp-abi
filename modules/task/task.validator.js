// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const { ValidateTestLoaderInput } = require('../studentTestResult/student_test_result.validator');

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
 * Validates the optional inputs for fetching all tasks.
 * @param {string} [task_status] - Optional. The status of the tasks to filter by.
 * @param {string} [test_id] - Optional. The ID of the test to filter tasks by.
 * @param {string} [user_id] - Optional. The ID of the user to filter tasks by.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetAllTasksInput(task_status, test_id, user_id) {
    const validStatus = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELETED'];

    if (!task_status) {
        return;
    }

    if (typeof task_status !== 'string' || !validStatus.includes(task_status.toUpperCase())) {
        throw new ApolloError(`Task status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'task_status'
        });
    }

    if (test_id && !mongoose.Types.ObjectId.isValid(test_id)) {
        throw new ApolloError(`Invalid test ID: ${test_id}`, "BAD_USER_INPUT");
    }

    if (user_id && !mongoose.Types.ObjectId.isValid(user_id)) {
        throw new ApolloError(`Invalid user ID: ${user_id}`, "BAD_USER_INPUT");
    }
}

/**
 * Validates if the provided value is a valid MongoDB ObjectId.
 * @param {string} id - The ID to be validated.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetOneTaskInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }
}

function ValidateCreateTaskInput(test, user, title, description, task_type, task_status, due_date) {
    const validTaskType = ['ASSIGN_CORRECTOR', 'ENTER_MARKS', 'VALIDATE_MARKS'];
    const validTaskStatus = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELETED'];

    if (!mongoose.Types.ObjectId.isValid(test)) {
        throw new ApolloError(`Invalid test ID: ${id}`, "BAD_USER_INPUT");
    }

    if (!mongoose.Types.ObjectId.isValid(user)) {
        throw new ApolloError(`Invalid user ID: ${id}`, "BAD_USER_INPUT");
    }

    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw new ApolloError('Title is required.', 'BAD_USER_INPUT', {
            field: 'title'
        });
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
        throw new ApolloError('Description is required.', 'BAD_USER_INPUT', {
            field: 'description'
        });
    }

    if (!task_type || typeof task_type !== 'string' || !validTaskType.includes(task_type.toUpperCase())) {
        throw new ApolloError(`Task type must be one of: ${validTaskType.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'task_type'
        });
    }

    if (!task_status || typeof task_status !== 'string' || !validTaskStatus.includes(task_status.toUpperCase())) {
        throw new ApolloError(`Task status must be one of: ${validTaskStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'task_status'
        });
    }

    if (!(due_date instanceof Date ? !isNaN(due_date.getTime()) : !isNaN(new Date(due_date).getTime()))) {
        throw new ApolloError('A valid date format is required.', 'BAD_USER_INPUT', {
            field: 'due_date'
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

/**
 * Validates the inputs for the TestLoader resolver on the Task type.
 * @param {object} task - The parent task object, which must contain a 'test' property with a valid ObjectID.
 * @param {object} context - The GraphQL context, which must contain a configured TestLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateTestLoaderInput(task, context) {
    if (!task || typeof task !== 'object' || task === null) {
        throw new ApolloError('Input error: task must be a valid object.', 'BAD_USER_INPUT', {
            field: 'task'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(task.test)) {
        throw new ApolloError('Input error: task.test must be a valid ID.', 'BAD_USER_INPUT', {
            field: 'task.test'
        });
    }

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.TestLoader ||
        typeof context.dataLoaders.TestLoader.load !== 'function'
    ) {
        throw new ApolloError('Server configuration error: TestLoader with load function not found on context.', 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Validates the inputs for resolvers that use the UserLoader.
 * @param {object} parent - The parent object.
 * @param {object} context - The GraphQL context, which must contain a configured UserLoader.
 * @param {string} fieldName - The name of the property on the block object that holds the user ID (e.g., 'created_by').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateUserLoaderInput(parent, context, fieldName) {
    if (!parent || typeof parent !== 'object' || parent === null) {
        throw new ApolloError('Input error: parent must be a valid object.', 'BAD_USER_INPUT');
    }

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.UserLoader ||
        typeof context.dataLoaders.UserLoader.load !== 'function'
    ) {
        throw new ApolloError('Server configuration error: UserLoader not found on context.', 'INTERNAL_SERVER_ERROR');
    }

    const userId = parent[fieldName];

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApolloError(`Input error: If provided, parent.${fieldName} must be a valid ID.`, 'BAD_USER_INPUT');
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateInputTypeObject,
    ValidateGetAllTasksInput,
    ValidateGetOneTaskInput,
    ValidateCreateTaskInput,
    ValidateAssignCorrectorInput,
    ValidateEnterMarksInput,
    ValidateValidateMarksInput,
    ValidateTestLoaderInput,
    ValidateUserLoaderInput
}