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
        throw new ApolloError('Failed to create school', 'SCHOOL_CREATION_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************


// *************** EXPORT MODULE ***************
module.exports = {
    GetAllBlocksHelper,
    GetOneBlockHelper,
    CreateBlockHelper
}