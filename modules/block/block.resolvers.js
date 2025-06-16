// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const {
    ValidateGetAllBlocksInput,
    ValidateGetOneBlockInput,
    ValidateCreateBlockInput,
    ValidateUpdateBlockInput,
    ValidateDeleteBlockInput
} = require('./block.validator');
const {
    GetAllBlocksHelper,
    GetOneBlockHelper,
    CreateBlockHelper,
    UpdateBlockHelper,
    DeleteBlockHelper
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

/**
 * GraphQL resolver to update an existing block.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the block to update.
 * @param {object} args.input - An object containing the new details for the block.
 * @returns {Promise<object>} - A promise that resolves to the updated block object.
 */
async function UpdateBlock(_, { id, input }) {
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
        const validatedInput = ValidateUpdateBlockInput(id, name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status);

        const updatedBlock = await UpdateBlockHelper(validatedInput);

        return updatedBlock;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in UpdateBlock:', error);

        throw new ApolloError('Failed to update block', 'UPDATE_BLOCK_FAILED');
    }
}

/**
 * GraphQL resolver to delete a block by its ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the block to delete.
 * @returns {Promise<object>} - A promise that resolves to the deleted block object.
 */
async function DeleteBlock(_, { id }) {
    try {
        const validatedId = ValidateDeleteBlockInput(id);

        const deletedBlock = DeleteBlockHelper(validatedId);

        return deletedBlock;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in DeleteBlock:', error);

        throw new ApolloError('Failed to delete block', 'DELETE_BLOCK_FAILED');
    }
}

// *************** LOADER ***************
/**
 * Loads the subjects associated with a block using a DataLoader.
 * @param {object} block - The parent block object.
 * @param {Array<string>} block.subjects - An array of subject IDs to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of subject objects.
 */
async function SubjectLoader(block, _, context) {
    try {
        return await context.dataLoaders.SubjectLoader.loadMany(block.subjects);
    } catch (error) {
        console.error("Error fetching subjects:", error);

        throw new ApolloError(`Failed to fetch subjects for ${block.name}: ${error.message}`, 'SUBJECT_FETCH_FAILED');
    }
}

/**
 * Loads the user who created the block using a DataLoader.
 * @param {object} block - The parent block object.
 * @param {string} block.created_by - The ID of the user who created the block.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(block, _, context) {
    try {
        return await context.dataLoaders.UserLoader.load(block.created_by);
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
    }
}

/**
 * Loads the user who last updated the block using a DataLoader.
 * @param {object} block - The parent block object.
 * @param {string} block.updated_by - The ID of the user who last updated the block.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(block, _, context) {
    try {
        return await context.dataLoaders.UserLoader.load(block.updated_by);
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
    }
}

/**
 * Loads the user who deleted the block using a DataLoader.
 * @param {object} block - The parent block object.
 * @param {string} block.updated_by - The ID of the user who performed the deletion.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function DeletedByLoader(block, _, context) {
    try {
        return await context.dataLoaders.UserLoader.load(block.updated_by);
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {
        GetAllBlocks,
        GetOneBlock
    },

    Mutation: {
        CreateBlock,
        UpdateBlock,
        DeleteBlock
    },

    Block: {
        subjects: SubjectLoader,
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader,
        deleted_by: DeletedByLoader
    }
}