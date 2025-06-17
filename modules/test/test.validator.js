// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const TestModel = require('./test.model');
const SubjectModel = require('../subject/subject.model');

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
async function ValidateCreateTestInput(subject, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status) {
    const validTestType = ['FREE_CONTINUOUS_CONTROL', 'MEMMOIRE_ORAL_NON_JURY', 'MEMOIRE_ORAL', 'MEMOIRE_WRITTEN', 'MENTOR_EVALUATION', 'ORAL', 'WRITTEN'];
    const validResultVisibility = ['NEVER', 'AFTER_CORRECTION', 'AFTER_JURY_DECISION_FOR_FINAL_TRANSCRIPT'];
    const validCorrectionType = ['ADMTC', 'CERTIFIER', 'ACADEMIC_CORRECTOR', 'PREPARATION_CENTER'];
    const validStatus = ['ACTIVE', 'INACTIVE'];

    if (!mongoose.Types.ObjectId.isValid(subject)) {
        throw new ApolloError(`Invalid subject ID: ${subject}`, "BAD_USER_INPUT", {
            field: 'subject'
        });
    }

    const subjectCheck = await SubjectModel.findOne({
        _id: subject,
        subject_status: 'ACTIVE'
    });
    if (!subjectCheck) {
        throw new ApolloError('Subject not found or is not active', 'NOT_FOUND', {
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
        const {
            notation_text,
            max_points
        } = notation;

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

    if (connected_test) {
        if (!mongoose.Types.ObjectId.isValid(connected_test)) {
            throw new ApolloError(`Invalid connected test ID: ${connected_test}`, "BAD_USER_INPUT", {
                field: 'connected_test'
            });
        }

        const connectedTestCheck = await TestModel.findOne({
            _id: connected_test,
            test_status: 'ACTIVE'
        });
        if (!connectedTestCheck) {
            throw new ApolloError('Connected test not found or is not active', 'NOT_FOUND', {
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