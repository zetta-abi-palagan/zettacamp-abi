// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT HELPER FUNCTION *************** 
const helper = require('./block.helper');

// *************** IMPORT VALIDATOR ***************
const validator = require('./block.validator');

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
        validator.ValidateGetAllBlocksInput(block_status);

        const blocks = await helper.GetAllBlocksHelper(block_status);

        return blocks;
    } catch (error) {
        console.error('Unexpected error in GetAllBlocks:', error);

        throw new ApolloError('Failed to retrieve blocks', 'GET_BLOCKS_FAILED', {
            error: error.message
        });
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
        ValidateGetOneBlockInput(id);

        const block = GetOneBlockHelper(id);

        return block;
    } catch (error) {
        console.error('Unexpected error in GetOneBlocks:', error);

        throw new ApolloError('Failed to retrieve block', 'GET_BLOCK_FAILED', {
            error: error.message
        });
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
async function CreateBlock(_, { createBlockInput }) {
    try {
        validator.ValidateInputTypeObject(createBlockInput);

        const {
            name,
            description,
            evaluation_type,
            block_type,
            connected_block,
            is_counted_in_final_transcript,
            block_status
        } = createBlockInput;

        validator.ValidateCreateBlockInput(name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status);

        const newBlock = await CreateBlockHelper(name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status);

        return newBlock;
    } catch (error) {
        console.error('Unexpected error in CreateBlock:', error);

        throw new ApolloError('Failed to create block', 'CREATE_BLOCK_FAILED', {
            error: error.message
        });
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
async function UpdateBlock(_, { id, updateBlockInput }) {
    try {
        validator.ValidateInputTypeObject(updateBlockInput)

        const {
            name,
            description,
            evaluation_type,
            block_type,
            connected_block,
            is_counted_in_final_transcript,
            block_status
        } = updateBlockInput;

        validator.ValidateUpdateBlockInput(id, name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status);

        const updatedBlock = await UpdateBlockHelper(id, name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status);

        return updatedBlock;
    } catch (error) {
        console.error('Unexpected error in UpdateBlock:', error);

        throw new ApolloError('Failed to update block', 'UPDATE_BLOCK_FAILED', {
            error: error.message
        });
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
        validator.ValidateDeleteBlockInput(id);

        const deletedBlock = DeleteBlockHelper(id);

        return deletedBlock;
    } catch (error) {
        console.error('Unexpected error in DeleteBlock:', error);

        throw new ApolloError('Failed to delete block', 'DELETE_BLOCK_FAILED', {
            error: error.message
        });
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
        validator.ValidateSubjectLoaderInput(block, context);

        const subjects = await context.dataLoaders.SubjectLoader.loadMany(block.subjects);

        return subjects;
    } catch (error) {
        console.error("Error fetching subjects:", error);

        throw new ApolloError(`Failed to fetch subjects for ${block.name}`, 'SUBJECT_FETCH_FAILED', {
            error: error.message
        });
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
        validator.ValidateUserLoaderInput(block, context, 'created_by');

        const created_by =  await context.dataLoaders.UserLoader.load(block.created_by);

        return created_by;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED', {
            error: error.message
        });
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
        validator.ValidateUserLoaderInput(block, context, 'updated_by');
        
        const updated_by = await context.dataLoaders.UserLoader.load(block.updated_by);

        return updated_by;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED', {
            error: error.message
        });
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
        validator.ValidateUserLoaderInput(block, context, 'deleted_by');

        const deleted_by = await context.dataLoaders.UserLoader.load(block.deleted_by);

        return deleted_by;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED', {
            error: error.message
        });
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