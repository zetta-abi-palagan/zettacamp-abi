// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates the inputs for the StudentLoader resolver on the FinalTranscriptResult type.
 * @param {object} finalTranscriptResult - The parent final transcript result object, which must contain a 'student' property with a valid ObjectID.
 * @param {object} context - The GraphQL context, which must contain a configured StudentLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateStudentLoaderInput(finalTranscriptResult, context) {
    if (!finalTranscriptResult || typeof finalTranscriptResult !== 'object' || finalTranscriptResult === null) {
        throw new ApolloError('Input error: finalTranscriptResult must be a valid object.', 'BAD_USER_INPUT', {
            field: 'finalTranscriptResult'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(finalTranscriptResult.student)) {
        throw new ApolloError('Input error: finalTranscriptResult.student must be a valid ID.', 'BAD_USER_INPUT', {
            field: 'finalTranscriptResult.student'
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

/**
 * Validates the inputs for the BlockLoader resolver.
 * @param {object} subject - The parent object, which must contain a 'block' property with a valid ObjectID.
 * @param {object} context - The GraphQL context, which must contain a configured BlockLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateBlockLoaderInput(parent, context) {
    if (!parent || typeof parent !== 'object' || parent === null) {
        throw new ApolloError('Input error: parent must be a valid object.', 'BAD_USER_INPUT');
    }

    if (!mongoose.Types.ObjectId.isValid(parent.block)) {
        throw new ApolloError('Input error: parent.block must be a valid ID.', 'BAD_USER_INPUT');
    }

    if (!context ||
        !context.dataLoaders ||
        !context.dataLoaders.BlockLoader ||
        typeof context.dataLoaders.BlockLoader.load !== 'function') {
        throw new ApolloError('Server configuration error: BlockLoader with load function not found on context.', 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Validates the inputs for the SubjectLoader resolver.
 * @param {object} parent - The parent object, which must contain a 'subject' property with a valid ObjectID.
 * @param {object} context - The GraphQL context, which must contain a configured SubjectLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateSubjectLoaderInput(parent, context) {
    if (!parent || typeof parent !== 'object' || parent === null) {
        throw new ApolloError('Input error: parent must be a valid object.', 'BAD_USER_INPUT', {
            field: 'parent'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(parent.subject)) {
        throw new ApolloError('Input error: parent.subject must be a valid ID.', 'BAD_USER_INPUT', {
            field: 'parent.subject'
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
 * Validates the inputs for the TestLoader resolver .
 * @param {object} parent - The parent object, which must contain a 'test' property with a valid ObjectID.
 * @param {object} context - The GraphQL context, which must contain a configured TestLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateTestLoaderInput(parent, context) {
    if (!parent || typeof parent !== 'object' || parent === null) {
        throw new ApolloError('Input error: parent must be a valid object.', 'BAD_USER_INPUT', {
            field: 'parent'
        });
    }

    if (!mongoose.Types.ObjectId.isValid(parent.test)) {
        throw new ApolloError('Input error: parent.test must be a valid ID.', 'BAD_USER_INPUT', {
            field: 'parent.test'
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

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateStudentLoaderInput,
    ValidateUserLoaderInput,
    ValidateBlockLoaderInput,
    ValidateSubjectLoaderInput,
    ValidateTestLoaderInput
}