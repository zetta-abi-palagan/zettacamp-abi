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
 * Validates the optional student_test_result_status input for fetching all student test results.
 * @param {string} student_test_result_status - The status of the results to filter by (e.g., 'PENDING').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetAllStudentTestResultsInput(student_test_result_status) {
    const validStatus = ['PENDING', 'VALIDATED'];

    if (!student_test_result_status) {
        return;
    }

    if (typeof student_test_result_status !== 'string' || !validStatus.includes(student_test_result_status.toUpperCase())) {
        throw new ApolloError(`Student test result status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'student_test_result_status'
        });
    }
}

/**
 * Validates the inputs for updating a student's test result.
 * @param {string} id - The unique identifier of the student test result.
 * @param {Array<object>} marks - A non-empty array of mark objects to be validated.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateUpdateStudentTestResultInput(id, marks) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
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
}

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateInputTypeObject,
    ValidateGetAllStudentTestResultsInput,
    ValidateUpdateStudentTestResultInput,
}