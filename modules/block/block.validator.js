// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const validator = require('validator');

/**
 * Validates the input for fetching all blocks.
 * @param {string} block_status - The status of the blocks to filter by (optional).
 * @returns {string} The validated block_status.
 */
function ValidateGetAllBlocksInput(block_status) {
    const validStatus = ['ACTIVE', 'INACTIVE', 'DELETED'];

    if (block_status && !validator.isIn(block_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`Block status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'block_status'
        });
    }

    return block_status
}

/**
 * Validates the input for fetching a single block.
 * @param {string} id - The ID of the block to validate.
 * @returns {string} The validated block ID.
 */
function ValidateGetOneBlockInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    return id;
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
 * @returns {object} An object containing the validated input data.
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

    if (!name || validator.isEmpty(name, { ignore_whitespace: true })) {
        throw new ApolloError('Name is required.', 'BAD_USER_INPUT', {
            field: 'name'
        });
    }

    if (!description || validator.isEmpty(description, { ignore_whitespace: true })) {
        throw new ApolloError('Description is required.', 'BAD_USER_INPUT', {
            field: 'description'
        });
    }

    if (!evaluation_type || !validator.isIn(evaluation_type.toUpperCase(), validEvaluationType)) {
        throw new ApolloError(`Evaluation type must be one of: ${validEvaluationType.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'evaluation_type'
        });
    }

    if (!block_type || !validator.isIn(block_type.toUpperCase(), validBlockType)) {
        throw new ApolloError(`Block type must be one of: ${validBlockType.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'block_type'
        });
    }

    if (!block_status || !validator.isIn(block_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`Block status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'block_status'
        });
    }

    if (connected_block) {
        const isValidObjectId = mongoose.Types.ObjectId.isValid(connected_block);
        if (!isValidObjectId) {
            throw new ApolloError(`Invalid ID: ${connected_block}`, "BAD_USER_INPUT");
        }
    }

    if (connected_block && block_type.toUpperCase() !== 'RETAKE') {
        throw new ApolloError(`Block type have to be RETAKE to have a connected block`, 'BAD_USER_INPUT', {
            field: 'connected_block'
        });
    }

    if (typeof is_counted_in_final_transcript !== 'boolean') {
        throw new ApolloError(`is_counted_in_final_transcript have to be type of boolean`, 'BAD_USER_INPUT', {
            field: 'is_counted_in_final_transcript'
        });
    }

    return {
        name,
        description,
        evaluation_type,
        block_type,
        connected_block,
        is_counted_in_final_transcript,
        block_status
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateGetAllBlocksInput,
    ValidateGetOneBlockInput,
    ValidateCreateBlockInput
};