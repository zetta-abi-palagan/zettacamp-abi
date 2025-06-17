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
 * Validates if the provided value is a valid MongoDB ObjectId.
 * @param {string} id - The ID to be validated.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateObjectId(id) {
    if (!id) {
        throw new ApolloError(`ID required: ${id}`, "INTERNAL_SERVER_ERROR");
    }

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Validates the input for fetching all subjects.
 * @param {string} subject_status - The status of the subjects to filter by (optional).
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetAllSubjectsInput(subject_status) {
    const validStatus = ['ACTIVE', 'INACTIVE', 'DELETED'];

    if (!subject_status) {
        return;
    }

    if (typeof subject_status !== 'string' || !validStatus.includes(subject_status.toUpperCase())) {
        throw new ApolloError(`Subject status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'subject_status'
        });
    }
}

/**
 * Validates the input for fetching a single subject.
 * @param {string} id - The ID of the subject to validate.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetOneSubjectInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }
}

/**
 * Validates the input fields for creating a new subject.
 * @param {string} block - The ID of the block to which the subject will be added.
 * @param {string} name - The name of the subject.
 * @param {string} description - The description of the subject.
 * @param {number} coefficient - The coefficient value of the subject.
 * @param {string} subject_status - The initial status of the subject (e.g., 'ACTIVE').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateCreateSubjectInput(block, name, description, coefficient, subject_status) {
    const validStatus = ['ACTIVE', 'INACTIVE'];

    if (!mongoose.Types.ObjectId.isValid(block)) {
        throw new ApolloError(`Invalid block ID: ${block}`, "BAD_USER_INPUT", {
            field: 'block'
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

    if (typeof coefficient !== 'number' || isNaN(coefficient) || coefficient < 0) {
        throw new ApolloError('Coefficient is required and must be a number greater than or equal to 0.', 'BAD_USER_INPUT', {
            field: 'coefficient'
        });
    }

    if (!subject_status || typeof subject_status !== 'string' || !validStatus.includes(subject_status.toUpperCase())) {
        throw new ApolloError(`Subject status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'subject_status'
        });
    }
}

/**
 * Validates the input fields for updating an existing subject.
 * @param {string} id - The unique identifier of the subject to be updated.
 * @param {string} name - The name of the subject.
 * @param {string} description - The description of the subject.
 * @param {number} coefficient - The coefficient value of the subject.
 * @param {Array<string>} connected_blocks - An array of block IDs to connect to a transversal subject.
 * @param {string} subject_status - The status of the subject (e.g., 'ACTIVE').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateUpdateSubjectInput(id, name, description, coefficient, connected_blocks, subject_status) {
    const validStatus = ['ACTIVE', 'INACTIVE'];

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
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

    if (typeof coefficient !== 'number' || isNaN(coefficient) || coefficient < 0) {
        throw new ApolloError('Coefficient is required and must be a number greater than or equal to 0.', 'BAD_USER_INPUT', {
            field: 'coefficient'
        });
    }

    if (connected_blocks) {
        if (!Array.isArray(connected_blocks)) {
            throw new ApolloError('Connected blocks must be an array.', 'BAD_USER_INPUT', {
                field: 'connected_blocks'
            });
        }

        for (const blockId of connected_blocks) {
            if (!mongoose.Types.ObjectId.isValid(blockId)) {
                throw new ApolloError(`Invalid connected block ID: ${blockId}`, 'BAD_USER_INPUT', {
                    field: 'connected_blocks'
                });
            }
        }
    }

    if (!subject_status || typeof subject_status !== 'string' || !validStatus.includes(subject_status.toUpperCase())) {
        throw new ApolloError(`Subject status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'subject_status'
        });
    }
}

/**
 * Validates the input ID for deleting a subject.
 * @param {string} id - The ID of the subject to validate.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateDeleteSubjectInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    return id;
}

/**
 * Validates the inputs for the BlockLoader resolver.
 * @param {object} subject - The parent subject object, which must contain a 'block' property with a valid ObjectID.
 * @param {object} context - The GraphQL context, which must contain a configured BlockLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateBlockLoaderInput(subject, context) {
    if (!subject || typeof subject !== 'object' || subject === null) {
        throw new ApolloError('Input error: subject must be a valid object.', 'BAD_USER_INPUT');
    }

    if (!mongoose.Types.ObjectId.isValid(subject.block)) {
        throw new ApolloError('Input error: subject.block must be a valid ID.', 'BAD_USER_INPUT');
    }

    if (!context || typeof context.dataLoaders?.BlockLoader?.load !== 'function') {
        throw new ApolloError('Server configuration error: BlockLoader with load function not found on context.', 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Validates the inputs for the ConnectedBlocksLoader resolver.
 * @param {object} subject - The parent subject object, which must contain a 'connected_blocks' array of valid ObjectIDs.
 * @param {object} context - The GraphQL context, which must contain a configured BlockLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateConnectedBlocksLoaderInput(subject, context) {
    if (!subject || typeof subject !== 'object' || subject === null) {
        throw new ApolloError('Input error: subject must be a valid object.', 'BAD_USER_INPUT', {
            field: 'subject'
        });
    }

    if (!Array.isArray(subject.connected_blocks)) {
        throw new ApolloError('Input error: subject.connected_blocks must be an array.', 'BAD_USER_INPUT', {
            field: 'subject.connected_blocks'
        });
    }

    for (const blockId of subject.connected_blocks) {
        if (!mongoose.Types.ObjectId.isValid(blockId)) {
            throw new ApolloError(`Invalid block ID found in connected_blocks array: ${blockId}`, 'BAD_USER_INPUT', {
                field: 'subject.connected_blocks'
            });
        }
    }

    if (!context || typeof context.dataLoaders?.BlockLoader?.loadMany !== 'function') {
        throw new ApolloError('Server configuration error: BlockLoader with loadMany function not found on context.', 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Validates the inputs for the TestLoader resolver.
 * @param {object} subject - The parent subject object, which must contain a 'tests' array of valid ObjectIDs.
 * @param {object} context - The GraphQL context, which must contain a configured TestLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateTestLoaderInput(subject, context) {
    if (!subject || typeof subject !== 'object' || subject === null) {
        throw new ApolloError('Input error: subject must be a valid object.', 'BAD_USER_INPUT', {
            field: 'subject'
        });
    }

    if (!Array.isArray(subject.tests)) {
        throw new ApolloError('Input error: subject.tests must be an array.', 'BAD_USER_INPUT', {
            field: 'subject.tests'
        });
    }

    for (const testId of subject.tests) {
        if (!mongoose.Types.ObjectId.isValid(testId)) {
            throw new ApolloError(`Invalid test ID found in tests array: ${testId}`, 'BAD_USER_INPUT', {
                field: 'subject.tests'
            });
        }
    }

    if (!context || typeof context.dataLoaders?.TestLoader?.loadMany !== 'function') {
        throw new ApolloError('Server configuration error: TestLoader with loadMany function not found on context.', 'INTERNAL_SERVER_ERROR');
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

    if (!context || typeof context.dataLoaders?.UserLoader?.load !== 'function') {
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
    ValidateObjectId,
    ValidateGetAllSubjectsInput,
    ValidateGetOneSubjectInput,
    ValidateCreateSubjectInput,
    ValidateUpdateSubjectInput,
    ValidateDeleteSubjectInput,
    ValidateBlockLoaderInput,
    ValidateConnectedBlocksLoaderInput,
    ValidateTestLoaderInput,
    ValidateUserLoaderInput
};