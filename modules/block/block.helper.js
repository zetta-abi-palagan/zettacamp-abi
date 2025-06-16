// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const BlockModel = require('./block.model');

// *************** QUERY ***************
/**
 * Fetches all blocks from the database, with an optional filter for block status.
 * @param {string} block_status - Optional. The status of the blocks to fetch (e.g., 'ACTIVE'). If not provided, blocks with any status are returned.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of block objects.
 */
async function GetAllBlocksHelper(block_status) {
    try {
        const filter = {};

        if (block_status) {
            filter.block_status = block_status;
        }

        return await BlockModel.find(filter);
    } catch (error) {
        throw new ApolloError(`Failed to fetch blocks: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Fetches a single block by its unique ID.
 * @param {string} id - The unique identifier of the block to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found block object.
 */
async function GetOneBlockHelper(id) {
    try {
        return await BlockModel.findOne({ _id: id });
    } catch (error) {
        throw new ApolloError(`Failed to fetch block: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

// *************** MUTATION ***************
/**
 * Creates a new block with the provided input data.
 * @param {object} input - An object containing the details for the new block.
 * @returns {Promise<object>} - A promise that resolves to the newly created block object.
 */
async function CreateBlockHelper(input) {
    const {
        name,
        description,
        evaluation_type,
        block_type,
        connected_block,
        is_counted_in_final_transcript,
        block_status
    } = input;

    // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
    const createdByUserId = '6846e5769e5502fce150eb67';

    const blockData = {
        name: name,
        description: description,
        evaluation_type: evaluation_type.toUpperCase(),
        block_type: block_type.toUpperCase(),
        connected_block: connected_block,
        is_counted_in_final_transcript: is_counted_in_final_transcript,
        block_status: block_status.toUpperCase(),
        created_by: createdByUserId,
        updated_by: createdByUserId
    }

    try {
        return await BlockModel.create(blockData)
    } catch (error) {
        throw new ApolloError('Failed to create block', 'BLOCK_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * Updates an existing block in the database with the provided data.
 * @param {object} input - An object containing the block's ID and the fields to be updated.
 * @returns {Promise<object>} - A promise that resolves to the updated block object.
 */
async function UpdateBlockHelper(input) {
    const {
        id,
        name,
        description,
        evaluation_type,
        block_type,
        connected_block,
        is_counted_in_final_transcript,
        block_status
    } = input;

    // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
    const updatedByUserId = '6846e5769e5502fce150eb67';

    const blockData = {
        name: name,
        description: description,
        evaluation_type: evaluation_type.toUpperCase(),
        block_type: block_type.toUpperCase(),
        connected_block: connected_block,
        is_counted_in_final_transcript: is_counted_in_final_transcript,
        block_status: block_status.toUpperCase(),
        updated_by: updatedByUserId
    }

    try {
        return await BlockModel.findOneAndUpdate({ _id: id }, blockData, { new: true });
    } catch (error) {
        throw new ApolloError('Failed to update block', 'BLOCK_UPDATE_FAILED', {
            error: error.message
        });
    }
}

/**
 * Performs a soft delete on a block by updating its status to 'DELETED'.
 * @param {string} id - The unique identifier of the block to be deleted.
 * @returns {Promise<object>} - A promise that resolves to the block object before the update.
 */
async function DeleteBlockHelper(id) {
    try {
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const deletedByUserId = '6846e5769e5502fce150eb67';

        const blockData = {
            block_status: 'DELETED',
            updated_at: deletedByUserId,
            deleted_by: deletedByUserId,
            deleted_at: Date.now()
        }

        return await BlockModel.findOneAndUpdate({ _id: id }, blockData);
    } catch (error) {
        throw new ApolloError('Failed to delete block', 'BLOCK_DELETION_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************


// *************** EXPORT MODULE ***************
module.exports = {
    GetAllBlocksHelper,
    GetOneBlockHelper,
    CreateBlockHelper,
    UpdateBlockHelper,
    DeleteBlockHelper
}