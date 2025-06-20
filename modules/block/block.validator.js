// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

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
 * Validates the input object for creating or updating a block.
 * @param {object} blockInput - An object containing the block's properties to be validated.
 * @param {string} blockInput.name - The name of the block.
 * @param {string} blockInput.description - The description of the block.
 * @param {string} blockInput.evaluation_type - The evaluation method (e.g., 'COMPETENCY', 'SCORE').
 * @param {string} blockInput.block_type - The type of block (e.g., 'REGULAR', 'RETAKE').
 * @param {string} [blockInput.connected_block] - Optional. The ID of a related block, required if block_type is 'RETAKE'.
 * @param {boolean} blockInput.is_counted_in_final_transcript - Flag indicating if the block affects the final transcript.
 * @param {string} [blockInput.block_status] - Optional. The status of the block (e.g., 'ACTIVE').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateBlockInput(blockInput) {
    const { name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status } = blockInput;
    const validEvaluationType = ['COMPETENCY', 'SCORE'];
    const validBlockType = ['REGULAR', 'COMPETENCY', 'SOFT_SKILL', 'ACADEMIC_RECOMMENDATION', 'SPECIALIZATION', 'TRANSVERSAL', 'RETAKE'];
    const validStatus = ['ACTIVE', 'INACTIVE'];
    const competencyBlockTypes = ['COMPETENCY', 'SOFT_SKILL', 'ACADEMIC_RECOMMENDATION', 'RETAKE'];
    const scoreBlockTypes = ['REGULAR', 'TRANSVERSAL', 'SPECIALIZATION', 'RETAKE'];

    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new ApolloError('Name is required.', 'BAD_USER_INPUT', { field: 'name' });
    }

    if (!description || typeof description !== 'string' || description.trim() === '') {
        throw new ApolloError('Description is required.', 'BAD_USER_INPUT', { field: 'description' });
    }

    if (!evaluation_type || !validEvaluationType.includes(evaluation_type.toUpperCase())) {
        throw new ApolloError(`Evaluation type must be one of: ${validEvaluationType.join(', ')}.`, 'BAD_USER_INPUT', { field: 'evaluation_type' });
    }

    if (!block_type || !validBlockType.includes(block_type.toUpperCase())) {
        throw new ApolloError(`Block type must be one of: ${validBlockType.join(', ')}.`, 'BAD_USER_INPUT', { field: 'block_type' });
    }

    if (block_status && !validStatus.includes(block_status.toUpperCase())) {
        throw new ApolloError(`Block status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', { field: 'block_status' });
    }

    if (typeof is_counted_in_final_transcript !== 'boolean') {
        throw new ApolloError('is_counted_in_final_transcript must be a boolean.', 'BAD_USER_INPUT', { field: 'is_counted_in_final_transcript' });
    }

    if (connected_block && !mongoose.Types.ObjectId.isValid(connected_block)) {
        throw new ApolloError(`Invalid connected_block ID: ${connected_block}`, "BAD_USER_INPUT", { field: 'connected_block' });
    }

    if (
        (evaluation_type.toUpperCase() === 'COMPETENCY' && !competencyBlockTypes.includes(block_type.toUpperCase())) ||
        (evaluation_type.toUpperCase() === 'SCORE' && !scoreBlockTypes.includes(block_type.toUpperCase()))
    ) {
        throw new ApolloError(
            `Invalid combination: ${evaluation_type.toUpperCase()} evaluation cannot be used with ${block_type.toUpperCase()} block type.`,
            'LOGIC_SANITY_ERROR'
        );
    }

    if (connected_block && block_type.toUpperCase() !== 'RETAKE') {
        throw new ApolloError('Block type must be RETAKE to have a connected block.', 'BAD_USER_INPUT', { field: 'connected_block' });
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

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.SubjectLoader ||
        typeof context.dataLoaders.SubjectLoader.loadMany !== 'function'
    ) {
        throw new ApolloError(
            'Server configuration error: SubjectLoader with loadMany function not found on context.',
            'INTERNAL_SERVER_ERROR'
        );
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
        throw new ApolloError(
            'Server configuration error: UserLoader not found on context.',
            'INTERNAL_SERVER_ERROR'
        );
    }

    const userId = parent[fieldName];

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApolloError(`Input error: If provided, parent.${fieldName} must be a valid ID.`, 'BAD_USER_INPUT');
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateGetAllBlocksInput,
    ValidateBlockInput,
    ValidateSubjectLoaderInput,
    ValidateUserLoaderInput
};