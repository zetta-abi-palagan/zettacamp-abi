// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates the input for fetching all subjects.
 * @param {string} subject_status - The status of the subjects to filter by (optional).
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateSubjectStatusFilter(subject_status) {
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
 * Validates the input object for creating or updating a subject using a rule-based approach.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.subjectInput - An object containing the subject's properties to be validated.
 * @param {string} [args.subjectInput.name] - The name of the subject.
 * @param {string} [args.subjectInput.description] - The description of the subject.
 * @param {number} [args.subjectInput.coefficient] - The coefficient value for the subject.
 * @param {string} [args.subjectInput.subject_status] - Optional. The status of the subject (e.g., 'ACTIVE').
 * @param {Array<string>} [args.subjectInput.connected_blocks] - Optional. An array of block IDs to connect.
 * @param {boolean} args.isTransversal - A flag indicating if the subject belongs to a transversal block.
 * @param {boolean} [args.isUpdate=false] - Optional flag to indicate if this is an update operation, which allows for partial data.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateSubjectInput({ subjectInput, isTransversal, isUpdate = false }) {
    const validStatus = ['ACTIVE', 'INACTIVE'];

    const validationRules = [
        {
            field: 'name',
            required: true,
            validate: (val) => typeof val === 'string' && val.trim() !== '',
            message: 'Name is required.',
        },
        {
            field: 'description',
            required: true,
            validate: (val) => typeof val === 'string' && val.trim() !== '',
            message: 'Description is required.',
        },
        {
            field: 'coefficient',
            required: true,
            validate: (val) => typeof val === 'number' && !isNaN(val) && val >= 0,
            message: 'Coefficient is required and must be a number >= 0.',
        },
        {
            field: 'subject_status',
            required: true,
            validate: (val) => typeof val === 'string' && validStatus.includes(val.toUpperCase()),
            message: `Subject status must be one of: ${validStatus.join(', ')}`,
        },
    ];

    for (const rule of validationRules) {
        const value = subjectInput[rule.field];

        if ((!isUpdate && rule.required) || value !== undefined) {
            if (!rule.validate(value)) {
                throw new ApolloError(rule.message, 'BAD_USER_INPUT', { field: rule.field });
            }
        }
    }

    const { connected_blocks } = subjectInput;
    if (connected_blocks !== undefined) {
        if (!Array.isArray(connected_blocks)) {
            throw new ApolloError('Connected blocks must be an array.', 'BAD_USER_INPUT', { field: 'connected_blocks' });
        }

        for (const blockId of connected_blocks) {
            if (!mongoose.Types.ObjectId.isValid(blockId)) {
                throw new ApolloError(`Invalid connected block ID: ${blockId}`, 'BAD_USER_INPUT', { field: 'connected_blocks' });
            }
        }

        if (!isTransversal) {
            throw new ApolloError('Connected blocks can only be assigned to a subject within a transversal block.', 'BAD_USER_INPUT', { field: 'connected_blocks' });
        }
    }

    if (typeof isTransversal !== 'boolean') {
        throw new ApolloError('isTransversal must be a boolean.', 'BAD_USER_INPUT', { field: 'isTransversal' });
    }
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

    if (!context ||
        !context.dataLoaders ||
        !context.dataLoaders.BlockLoader ||
        typeof context.dataLoaders.BlockLoader.load !== 'function') {
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

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.BlockLoader ||
        typeof context.dataLoaders.BlockLoader.loadMany !== 'function'
    ) {
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

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.TestLoader ||
        typeof context.dataLoaders.TestLoader.loadMany !== 'function'
    ) {
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
    ValidateSubjectStatusFilter,
    ValidateSubjectInput,
    ValidateBlockLoaderInput,
    ValidateConnectedBlocksLoaderInput,
    ValidateTestLoaderInput,
    ValidateUserLoaderInput
};