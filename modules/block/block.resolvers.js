// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const {
    ValidateGetAllBlocksInput,
    ValidateGetOneBlockInput,
    ValidateCreateBlockInput
} = require('./block.validator');
const {
    GetAllBlocksHelper,
    GetOneBlockHelper,
    CreateBlockHelper
} = require('./block.helper');

// *************** QUERY ***************
/**
 * GraphQL resolver to fetch all blocks, with an optional filter for block status.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} [args.block_status] - Optional. The status to filter blocks by (e.g., 'ACTIVE').
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of block objects.
 */
async function GetAllBlocks(_, { block_status }) {
    try {
        const validatedBlockStatus = ValidateGetAllBlocksInput(block_status);

        const blocks = await GetAllBlocksHelper(validatedBlockStatus);

        return blocks;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in GetAllBlocks:', error);

        throw new ApolloError('Failed to retrieve blocks', 'GET_BLOCKS_FAILED');
    }
}

/**
 * GraphQL resolver to fetch a single block by its unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} args.id - The unique identifier of the block to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found block object.
 */
async function GetOneBlock(_, { id }) {
    try {
        const validatedId = ValidateGetOneBlockInput(id);

        const block = GetOneBlockHelper(validatedId);

        return block;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in GetOneBlocks:', error);

        throw new ApolloError('Failed to retrieve block', 'GET_BLOCK_FAILED');
    }
}

// *************** MUTATION ***************
/**
 * GraphQL resolver to create a new block.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {object} args.input - An object containing the details for the new block.
 * @returns {Promise<object>} - A promise that resolves to the newly created block object.
 */
async function CreateBlock(_, { input }) {
    const {
        name,
        description,
        evaluation_type,
        block_type,
        connected_block,
        is_counted_in_final_transcript,
        block_status
    } = input;

    try {
        const validatedInput = ValidateCreateBlockInput(name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status);

        const newBlock = await CreateBlockHelper(validatedInput);

        return newBlock;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in CreateBlock:', error);

        throw new ApolloError('Failed to create block', 'CREATE_BLOCK_FAILED');
    }
}

// *************** LOADER ***************


// *************** EXPORT MODULE ***************
module.exports = {
    Query: {
        GetAllBlocks,
        GetOneBlock
    },

    Mutation: {
        CreateBlock
    }
}