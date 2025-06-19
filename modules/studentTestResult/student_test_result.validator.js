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
 * Validates the optional inputs for fetching all student test results.
 * @param {string} [student_test_result_status] - Optional. The status of the results to filter by.
 * @param {string} [test_id] - Optional. The ID of the test to filter by.
 * @param {string} [student_id] - Optional. The ID of the student to filter by.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetAllStudentTestResultsInput(student_test_result_status, test_id, student_id) {
    const validStatus = ['PENDING', 'VALIDATED', 'DELETED'];

    if (!student_test_result_status) {
        return;
    }

    if (typeof student_test_result_status !== 'string' || !validStatus.includes(student_test_result_status.toUpperCase())) {
        throw new ApolloError(`Student test result status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'student_test_result_status'
        });
    }

    if (test_id && !mongoose.Types.ObjectId.isValid(test_id)) {
        throw new ApolloError(`Invalid test ID: ${test_id}`, "BAD_USER_INPUT");
    }

    if (student_id && !mongoose.Types.ObjectId.isValid(student_id)) {
        throw new ApolloError(`Invalid student ID: ${student_id}`, "BAD_USER_INPUT");
    }
}

/**
 * Validates if the provided value is a valid MongoDB ObjectId.
 * @param {string} id - The ID to be validated.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetOneStudentTestResultInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
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

/**
 * Validates the input ID for invalidating a student test result.
 * @param {string} id - The ID of the student test result to validate.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateInvalidateStudentTestResultInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }
}

/**
 * Loads the student associated with a test result using a DataLoader.
 * @param {object} studentTestResult - The parent student test result object.
 * @param {string} studentTestResult.student - The ID of the student to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the student object.
 */
function ValidateStudentLoaderInput(studentTestResult, context) {
    if (!studentTestResult || typeof studentTestResult !== 'object' || studentTestResult === null) {
        throw new ApolloError('Input error: studentTestResult must be a valid object.', 'BAD_USER_INPUT', {
            field: 'studentTestResult'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(studentTestResult.student)) {
        throw new ApolloError('Input error: studentTestResult.student must be a valid ID.', 'BAD_USER_INPUT', {
            field: 'studentTestResult.student'
        });
    }

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.StudentLoader ||
        typeof context.dataLoaders.StudentLoader.load !== 'function'
    ) {
        throw new ApolloError('Server configuration error: StudentLoader with load function not found on context.', 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Loads the test associated with a student's result using a DataLoader.
 * @param {object} studentTestResult - The parent student test result object.
 * @param {string} studentTestResult.test - The ID of the test to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the test object.
 */
function ValidateTestLoaderInput(studentTestResult, context) {
    if (!studentTestResult || typeof studentTestResult !== 'object' || studentTestResult === null) {
        throw new ApolloError('Input error: studentTestResult must be a valid object.', 'BAD_USER_INPUT', {
            field: 'studentTestResult'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(studentTestResult.test)) {
        throw new ApolloError('Input error: studentTestResult.test must be a valid ID.', 'BAD_USER_INPUT', {
            field: 'studentTestResult.test'
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
    ValidateGetAllStudentTestResultsInput,
    ValidateGetOneStudentTestResultInput,
    ValidateUpdateStudentTestResultInput,
    ValidateInvalidateStudentTestResultInput,
    ValidateStudentLoaderInput,
    ValidateTestLoaderInput,
    ValidateUserLoaderInput
}