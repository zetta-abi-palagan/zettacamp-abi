// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates the optional test_status input for fetching tests.
 * @param {string} [test_status] - Optional. The status of the tests to filter by (e.g., 'ACTIVE').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateTestStatusFilter(test_status) {
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


function ValidateTestInput({ testInput, evaluationType }) {
    const { name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status } = testInput;
    const validTestType = ['FREE_CONTINUOUS_CONTROL', 'MEMMOIRE_ORAL_NON_JURY', 'MEMOIRE_ORAL', 'MEMOIRE_WRITTEN', 'MENTOR_EVALUATION', 'ORAL', 'WRITTEN'];
    const validResultVisibility = ['NEVER', 'AFTER_CORRECTION', 'AFTER_JURY_DECISION_FOR_FINAL_TRANSCRIPT'];
    const validCorrectionType = ['ADMTC', 'CERTIFIER', 'CROSS_CORRECTION', 'PREPARATION_CENTER'];
    const validStatus = ['ACTIVE', 'INACTIVE'];

    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new ApolloError('Name is required.', 'BAD_USER_INPUT', { field: 'name' });
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
        throw new ApolloError('Description is required.', 'BAD_USER_INPUT', { field: 'description' });
    }

    if (!test_type || typeof test_type !== 'string' || !validTestType.includes(test_type.toUpperCase())) {
        throw new ApolloError(`Test type must be one of: ${validTestType.join(', ')}.`, 'BAD_USER_INPUT', { field: 'test_type' });
    }

    if (!result_visibility || typeof result_visibility !== 'string' || !validResultVisibility.includes(result_visibility.toUpperCase())) {
        throw new ApolloError(`Result visibility must be one of: ${validResultVisibility.join(', ')}.`, 'BAD_USER_INPUT', { field: 'result_visibility' });
    }

    if (typeof weight !== 'number' || isNaN(weight) || weight < 0 || weight > 1) {
        throw new ApolloError('Weight is required and must be a number between 0 and 1.', 'BAD_USER_INPUT', { field: 'weight' });
    }

    if (!correction_type || typeof correction_type !== 'string' || !validCorrectionType.includes(correction_type.toUpperCase())) {
        throw new ApolloError(`Correction type must be one of: ${validCorrectionType.join(', ')}.`, 'BAD_USER_INPUT', { field: 'correction_type' });
    }

    if (!Array.isArray(notations) || !notations.length) {
        throw new ApolloError('Notations must be a non-empty array.', 'BAD_USER_INPUT', { field: 'notations' });
    }

    for (const [index, notation] of notations.entries()) {
        const { notation_text, max_points } = notation;
        if (!notation_text || typeof notation_text !== 'string' || notation_text.trim() === '') {
            throw new ApolloError(`Notation at index ${index} must have non-empty text.`, 'BAD_USER_INPUT', { field: `notations[${index}].notation_text` });
        }
        if (typeof max_points !== 'number' || isNaN(max_points) || max_points < 0) {
            throw new ApolloError(`Notation at index ${index} must have a valid max_points (number ≥ 0).`, 'BAD_USER_INPUT', { field: `notations[${index}].max_points` });
        }
    }

    if (typeof is_retake !== 'boolean') {
        throw new ApolloError('is_retake must be a boolean.', 'BAD_USER_INPUT', { field: 'is_retake' });
    }

    if (is_retake) {
        if (!connected_test) {
            throw new ApolloError('connected_test is required when is_retake is true.', 'BAD_USER_INPUT', { field: 'connected_test' });
        }
        if (!mongoose.Types.ObjectId.isValid(connected_test)) {
            throw new ApolloError(`Invalid connected test ID: ${connected_test}`, "BAD_USER_INPUT", { field: 'connected_test' });
        }
    }

    if (test_status && !validStatus.includes(test_status.toUpperCase())) {
        throw new ApolloError(`Test status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', { field: 'test_status' });
    }

    const competencyTestTypes = ['ORAL', 'WRITTEN', 'MEMOIRE_WRITTEN', 'FREE_CONTINUOUS_CONTROL', 'MENTOR_EVALUATION'];
    const scoreTestTypes = ['FREE_CONTINUOUS_CONTROL', 'MEMMOIRE_ORAL_NON_JURY', 'MEMOIRE_ORAL', 'MEMOIRE_WRITTEN', 'MENTOR_EVALUATION', 'ORAL', 'WRITTEN'];
    const upperTestType = test_type.toUpperCase();

    if (
        (evaluationType === 'COMPETENCY' && !competencyTestTypes.includes(upperTestType)) ||
        (evaluationType === 'SCORE' && !scoreTestTypes.includes(upperTestType))
    ) {
        throw new ApolloError(`Test type '${upperTestType}' is not allowed for block with evaluation_type '${evaluationType}'.`, 'BAD_USER_INPUT', { field: 'test_type' });
    }
}


function ValidatePublishTestInput({ assignCorrectorDueDate, testDueDate }) {
    if (assignCorrectorDueDate && isNaN(new Date(assignCorrectorDueDate).getTime())) {
        throw new ApolloError('A valid date format is required for assign_corrector_due_date.', 'BAD_USER_INPUT', {
            field: 'assign_corrector_due_date'
        });
    }
    if (testDueDate && isNaN(new Date(testDueDate).getTime())) {
        throw new ApolloError('A valid date format is required for test_due_date.', 'BAD_USER_INPUT', {
            field: 'test_due_date'
        });
    }
}

/**
 * Validates the inputs for the SubjectLoader resolver on the Test type.
 * @param {object} test - The parent test object, which must contain a 'subject' property with a valid ObjectID.
 * @param {object} context - The GraphQL context, which must contain a configured SubjectLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateSubjectLoaderInput(test, context) {
    if (!test || typeof test !== 'object' || test === null) {
        throw new ApolloError('Input error: test must be a valid object.', 'BAD_USER_INPUT', {
            field: 'test'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(test.subject)) {
        throw new ApolloError('Input error: test.subject must be a valid ID.', 'BAD_USER_INPUT', {
            field: 'test.subject'
        });
    }

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.SubjectLoader ||
        typeof context.dataLoaders.SubjectLoader.load !== 'function'
    ) {
        throw new ApolloError('Server configuration error: SubjectLoader with load function not found on context.', 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Validates the inputs for the StudentTestResultLoader resolver.
 * @param {object} test - The parent test object, which must contain a 'student_test_results' array of valid ObjectIDs.
 * @param {object} context - The GraphQL context, which must contain a configured StudentTestResultLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateStudentTestResultLoaderInput(test, context) {
    if (!test || typeof test !== 'object' || test === null) {
        throw new ApolloError('Input error: test must be a valid object.', 'BAD_USER_INPUT', {
            field: 'test'
        });
    }

    if (!Array.isArray(test.student_test_results)) {
        throw new ApolloError('Input error: test.student_test_results must be an array.', 'BAD_USER_INPUT', {
            field: 'test.student_test_results'
        });
    }

    for (const resultId of test.student_test_results) {
        if (!mongoose.Types.ObjectId.isValid(resultId)) {
            throw new ApolloError(`Invalid ID found in student_test_results array: ${resultId}`, 'BAD_USER_INPUT', {
                field: 'test.student_test_results'
            });
        }
    }

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.StudentTestResultLoader ||
        typeof context.dataLoaders.StudentTestResultLoader.loadMany !== 'function'
    ) {
        throw new ApolloError('Server configuration error: StudentTestResultLoader with loadMany function not found on context.', 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Validates the inputs for the TaskLoader resolver.
 * @param {object} test - The parent test object, which must contain a 'tasks' array of valid ObjectIDs.
 * @param {object} context - The GraphQL context, which must contain a configured TaskLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateTaskLoaderInput(test, context) {
    if (!test || typeof test !== 'object' || test === null) {
        throw new ApolloError('Input error: test must be a valid object.', 'BAD_USER_INPUT', {
            field: 'test'
        });
    }

    if (!Array.isArray(test.tasks)) {
        throw new ApolloError('Input error: test.tasks must be an array.', 'BAD_USER_INPUT', {
            field: 'test.tasks'
        });
    }

    for (const taskId of test.tasks) {
        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            throw new ApolloError(`Invalid ID found in tasks array: ${taskId}`, 'BAD_USER_INPUT', {
                field: 'test.tasks'
            });
        }
    }

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.TaskLoader ||
        typeof context.dataLoaders.TaskLoader.loadMany !== 'function'
    ) {
        throw new ApolloError('Server configuration error: TaskLoader with loadMany function not found on context.', 'INTERNAL_SERVER_ERROR');
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
    ValidateTestStatusFilter,
    ValidateTestInput,
    ValidatePublishTestInput,
    ValidateSubjectLoaderInput,
    ValidateStudentTestResultLoaderInput,
    ValidateTaskLoaderInput,
    ValidateUserLoaderInput
};