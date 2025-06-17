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
 * Validates the input for fetching all blocks.
 * @param {string} block_status - The status of the blocks to filter by (optional).
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetAllBlocksInput(block_status) {
    const validStatus = ['ACTIVE', 'INACTIVE', 'DELETED'];

    if (!block_status) {
        return;
    }

    if (typeof block_status !== 'string' || !validStatus.includes(block_status.toUpperCase())) {
        throw new ApolloError(`Block status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'block_status'
        });
    }
}

/**
 * Validates the input for fetching a single block.
 * @param {string} id - The ID of the block to validate.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetOneBlockInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }
}

/**
 * Validates the input fields for creating a new block.
 * @param {string} name - The name of the block.
 * @param {string} description - The description of the block.
 * @param {string} evaluation_type - The evaluation methodology (e.g., 'COMPETENCY', 'SCORE').
 * @param {string} block_type - The type of block (e.g., 'REGULAR', 'RETAKE').
 * @param {string} connected_block - The ID of a related block, required if block_type is 'RETAKE'.
 * @param {boolean} is_counted_in_final_transcript - Flag to indicate if the block affects the final transcript.
 * @param {string} block_status - The initial status of the block (e.g., 'ACTIVE').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateCreateBlockInput(
    name,
    description,
    evaluation_type,
    block_type,
    connected_block,
    is_counted_in_final_transcript,
    block_status
) {
    const validEvaluationType = ['COMPETENCY', 'SCORE'];
    const validBlockType = ['REGULAR', 'COMPETENCY', 'SOFT_SKILL', 'ACADEMIC_RECOMMENDATION', 'SPECIALIZATION', 'TRANSVERSAL', 'RETAKE'];
    const validStatus = ['ACTIVE', 'INACTIVE'];

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

    if (!evaluation_type || typeof evaluation_type !== 'string' || !validEvaluationType.includes(evaluation_type.toUpperCase())) {
        throw new ApolloError(`Evaluation type must be one of: ${validEvaluationType.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'evaluation_type'
        });
    }

    if (!block_type || typeof block_type !== 'string' || !validBlockType.includes(block_type.toUpperCase())) {
        throw new ApolloError(`Block type must be one of: ${validBlockType.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'block_type'
        });
    }

    if (!block_status || typeof block_status !== 'string' || !validStatus.includes(block_status.toUpperCase())) {
        throw new ApolloError(`Block status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'block_status'
        });
    }

    if (typeof is_counted_in_final_transcript !== 'boolean') {
        throw new ApolloError('is_counted_in_final_transcript must be a boolean.', 'BAD_USER_INPUT', {
            field: 'is_counted_in_final_transcript'
        });
    }

    if (connected_block && !mongoose.Types.ObjectId.isValid(connected_block)) {
        throw new ApolloError(`Invalid connected_block ID: ${connected_block}`, "BAD_USER_INPUT", {
            field: 'connected_block'
        });
    }

    if (connected_block && block_type.toUpperCase() !== 'RETAKE') {
        throw new ApolloError('Block type must be RETAKE to have a connected block.', 'BAD_USER_INPUT', {
            field: 'connected_block'
        });
    }
}

/**
 * Validates the input fields for updating an existing block.
 * @param {string} id - The unique identifier of the block to be updated.
 * @param {string} name - The name of the block.
 * @param {string} description - The description of the block.
 * @param {string} evaluation_type - The evaluation methodology (e.g., 'COMPETENCY', 'SCORE').
 * @param {string} block_type - The type of block (e.g., 'REGULAR', 'RETAKE').
 * @param {string} connected_block - The ID of a related block, required if block_type is 'RETAKE'.
 * @param {boolean} is_counted_in_final_transcript - Flag to indicate if the block affects the final transcript.
 * @param {string} block_status - The status of the block (e.g., 'ACTIVE').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateUpdateBlockInput(
    id,
    name,
    description,
    evaluation_type,
    block_type,
    connected_block,
    is_counted_in_final_transcript,
    block_status
) {
    const validEvaluationType = ['COMPETENCY', 'SCORE'];
    const validBlockType = ['REGULAR', 'COMPETENCY', 'SOFT_SKILL', 'ACADEMIC_RECOMMENDATION', 'SPECIALIZATION', 'TRANSVERSAL', 'RETAKE'];
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

    if (!evaluation_type || typeof evaluation_type !== 'string' || !validEvaluationType.includes(evaluation_type.toUpperCase())) {
        throw new ApolloError(`Evaluation type must be one of: ${validEvaluationType.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'evaluation_type'
        });
    }

    if (!block_type || typeof block_type !== 'string' || !validBlockType.includes(block_type.toUpperCase())) {
        throw new ApolloError(`Block type must be one of: ${validBlockType.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'block_type'
        });
    }

    if (!block_status || typeof block_status !== 'string' || !validStatus.includes(block_status.toUpperCase())) {
        throw new ApolloError(`Block status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'block_status'
        });
    }

    if (typeof is_counted_in_final_transcript !== 'boolean') {
        throw new ApolloError('is_counted_in_final_transcript must be a boolean.', 'BAD_USER_INPUT', {
            field: 'is_counted_in_final_transcript'
        });
    }

    if (connected_block && !mongoose.Types.ObjectId.isValid(connected_block)) {
        throw new ApolloError(`Invalid connected_block ID: ${connected_block}`, "BAD_USER_INPUT", {
            field: 'connected_block'
        });
    }

    if (connected_block && block_type.toUpperCase() !== 'RETAKE') {
        throw new ApolloError('Block type must be RETAKE to have a connected block.', 'BAD_USER_INPUT', {
            field: 'connected_block'
        });
    }
}

/**
 * Validates the input ID for deleting a block.
 * @param {string} id - The ID of the block to validate.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateDeleteBlockInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }
}

/**
 * Validates the inputs for the SubjectLoader resolver.
 * @param {object} block - The parent block object, which must contain a 'subjects' array of valid ObjectIDs.
 * @param {object} context - The GraphQL context, which must contain a configured SubjectLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateSubjectLoaderInput(block, context) {
    if (!block || typeof block !== 'object' || block === null) {
        throw new ApolloError('Input error: block must be a valid object.', 'BAD_USER_INPUT', {
            field: 'block'
        });
    }

    if (!Array.isArray(block.subjects)) {
        throw new ApolloError('Input error: block.subjects must be an array.', 'BAD_USER_INPUT', {
            field: 'block.subjects'
        });
    }

    for (const subjectId of block.subjects) {
        if (!mongoose.Types.ObjectId.isValid(subjectId)) {
            throw new ApolloError(`Invalid subject ID found in subjects array: ${subjectId}`, 'BAD_USER_INPUT', {
                field: 'block.subjects'
            });
        }
    }

    if (!context || typeof context.dataLoaders?.SubjectLoader?.loadMany !== 'function') {
        throw new ApolloError('Server configuration error: SubjectLoader with loadMany function not found on context.', 'INTERNAL_SERVER_ERROR');
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
    ValidateGetAllBlocksInput,
    ValidateGetOneBlockInput,
    ValidateCreateBlockInput,
    ValidateUpdateBlockInput,
    ValidateDeleteBlockInput,
    ValidateSubjectLoaderInput,
    ValidateUserLoaderInput
};