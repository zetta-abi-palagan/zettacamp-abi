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
 * Validates the optional test_status input for fetching all tests.
 * @param {string} test_status - The status of the tests to filter by (e.g., 'ACTIVE').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetAllTestsInput(test_status) {
    const validStatus = ['ACTIVE', 'INACTIVE', 'DELETED'];

    if (!test_status) {
        return;
    }

    if (typeof test_status !== 'string' || !validStatus.includes(test_status.toUpperCase())) {
        throw new ApolloError(`Test status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'test_status'
        });
    }
}

/**
 * Validates if the provided value is a valid MongoDB ObjectId.
 * @param {string} id - The ID to be validated.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetOneTestInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }
}

/**
 * Validates the input fields for creating a new test.
 * @param {string} subject - The ID of the parent subject for the test.
 * @param {string} name - The name of the test.
 * @param {string} description - The description of the test.
 * @param {string} test_type - The type of the test (e.g., 'QUIZ', 'EXAM').
 * @param {string} result_visibility - The visibility setting for the test results.
 * @param {number} weight - The weight of the test, must be between 0 and 1.
 * @param {string} correction_type - The correction method for the test.
 * @param {Array<object>} notations - The notation system used for the test.
 * @param {boolean} is_retake - Flag indicating if this is a retake test.
 * @param {string} connected_test - The ID of the original test if this is a retake.
 * @param {string} test_status - The initial status of the test (e.g., 'ACTIVE').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateCreateTestInput(subject, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status) {
    const validTestType = ['FREE_CONTINUOUS_CONTROL', 'MEMMOIRE_ORAL_NON_JURY', 'MEMOIRE_ORAL', 'MEMOIRE_WRITTEN', 'MENTOR_EVALUATION', 'ORAL', 'WRITTEN'];
    const validResultVisibility = ['NEVER', 'AFTER_CORRECTION', 'AFTER_JURY_DECISION_FOR_FINAL_TRANSCRIPT'];
    const validCorrectionType = ['ADMTC', 'CERTIFIER', 'ACADEMIC_CORRECTOR', 'PREPARATION_CENTER'];
    const validStatus = ['ACTIVE', 'INACTIVE'];

    if (!mongoose.Types.ObjectId.isValid(subject)) {
        throw new ApolloError(`Invalid subject ID: ${subject}`, "BAD_USER_INPUT", {
            field: 'subject'
        });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new ApolloError('Name is required.', 'BAD_USER_INPUT', {
            field: 'name'
        });
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
        throw new ApolloError('Description is required.', 'BAD_USER_INPUT', {
            field: 'description'
        });
    }

    if (!test_type || typeof test_type !== 'string' || !validTestType.includes(test_type.toUpperCase())) {
        throw new ApolloError(`Test type must be one of: ${validTestType.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'test_type'
        });
    }

    if (!result_visibility || typeof result_visibility !== 'string' || !validResultVisibility.includes(result_visibility.toUpperCase())) {
        throw new ApolloError(`Result visibility must be one of: ${validResultVisibility.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'result_visibility'
        });
    }

    if (typeof weight !== 'number' || isNaN(weight) || weight < 0 || weight > 1) {
        throw new ApolloError('Weight is required and must be a number between 0 and 1.', 'BAD_USER_INPUT', {
            field: 'weight'
        });
    }

    if (!correction_type || typeof correction_type !== 'string' || !validCorrectionType.includes(correction_type.toUpperCase())) {
        throw new ApolloError(`Correction type must be one of: ${validCorrectionType.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'correction_type'
        });
    }

    if (!Array.isArray(notations) || !notations.length) {
        throw new ApolloError('Notations must be a non-empty array.', 'BAD_USER_INPUT', {
            field: 'notations'
        });
    }

    for (const [index, notation] of notations.entries()) {
        const { notation_text, max_points } = notation;

        if (!notation_text || typeof notation_text !== 'string' || notation_text.trim() === '') {
            throw new ApolloError(`Notation at index ${index} must have non-empty text.`, 'BAD_USER_INPUT', {
                field: `notations[${index}].notation_text`
            });
        }

        if (typeof max_points !== 'number' || isNaN(max_points) || max_points < 0) {
            throw new ApolloError(`Notation at index ${index} must have a valid max_points (number ≥ 0).`, 'BAD_USER_INPUT', {
                field: `notations[${index}].max_points`
            });
        }
    }

    if (typeof is_retake !== 'boolean') {
        throw new ApolloError('is_retake must be a boolean.', 'BAD_USER_INPUT', {
            field: 'is_retake'
        });
    }

    if (is_retake) {
        if (!connected_test) {
            throw new ApolloError('connected_test is required when is_retake is true.', 'BAD_USER_INPUT', {
                field: 'connected_test'
            });
        }
        if (!mongoose.Types.ObjectId.isValid(connected_test)) {
            throw new ApolloError(`Invalid connected test ID: ${connected_test}`, "BAD_USER_INPUT", {
                field: 'connected_test'
            });
        }
    }

    if (!test_status || typeof test_status !== 'string' || !validStatus.includes(test_status.toUpperCase())) {
        throw new ApolloError(`Test status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'test_status'
        });
    }
}

/**
 * Validates the inputs for publishing a test.
 * @param {string} id - The ID of the test to be published.
 * @param {Date|string} assign_corrector_due_date - The due date for assigning a corrector.
 * @param {Date|string} test_due_date - The due date for the test.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidatePublishTestInput(id, assign_corrector_due_date, test_due_date) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }
    
    if (!(assign_corrector_due_date instanceof Date ? !isNaN(assign_corrector_due_date.getTime()) : !isNaN(new Date(assign_corrector_due_date).getTime()))) {
        throw new ApolloError('A valid date of birth format is required.', 'BAD_USER_INPUT', {
            field: 'assign_corrector_due_date'
        });
    }

    if (!(test_due_date instanceof Date ? !isNaN(test_due_date.getTime()) : !isNaN(new Date(test_due_date).getTime()))) {
        throw new ApolloError('A valid date of birth format is required.', 'BAD_USER_INPUT', {
            field: 'test_due_date'
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateInputTypeObject,
    ValidateGetAllTestsInput,
    ValidateGetOneTestInput,
    ValidateCreateTestInput,
    ValidatePublishTestInput,
    ValidateUpdateTestInput,
    ValidateDeleteTestInput
};