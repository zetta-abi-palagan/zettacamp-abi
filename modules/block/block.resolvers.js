// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const BlockModel = require('./block.model');
const SubjectModel = require('../subject/subject.model');
const TestModel = require('../test/test.model');
const StudentTestResultModel = require('../studentTestResult/student_test_result.model');
const TaskModel = require('../task/task.model');

// *************** IMPORT HELPER FUNCTION *************** 
const BlockHelper = require('./block.helper');

// *************** IMPORT VALIDATOR ***************
const BlockValidator = require('./block.validator');
const CommonValidator = require('../../shared/validator/index');

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
        BlockValidator.ValidateBlockStatusFilter(block_status);

        const blockFilter = block_status ? { block_status: block_status } : { block_status: { $ne: 'DELETED' } };

        const blocks = await BlockModel.find(blockFilter).lean();

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
        CommonValidator.ValidateObjectId(id)

        const block = await BlockModel.findById(id).lean();
        if (!block) {
            throw new ApolloError('Block not found', 'BLOCK_NOT_FOUND');
        }

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
 * @param {object} args.createBlockInput - An object containing the details for the new block.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to the newly created block object.
 */
async function CreateBlock(_, { createBlockInput }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateInputTypeObject(createBlockInput);
        BlockValidator.ValidateBlockInput({ blockInput: createBlockInput });

        // *************** Prepare payload and create the block
        const createBlockPayload = BlockHelper.GetCreateBlockPayload({ createBlockInput, userId });

        const newBlock = await BlockModel.create(createBlockPayload);
        if (!newBlock) {
            throw new ApolloError('Failed to create block', 'CREATE_BLOCK_FAILED');
        }

        return newBlock;
    } catch (error) {
        console.error('Unexpected error in CreateBlock:', error);

        throw new ApolloError('Failed to create block', 'CREATE_BLOCK_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to update an existing block with partial data.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the block to update.
 * @param {object} args.updateBlockInput - An object containing the fields to be updated.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to the updated block object.
 */
async function UpdateBlock(_, { id, updateBlockInput }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateObjectId(id);
        CommonValidator.ValidateInputTypeObject(updateBlockInput);

        const block = await BlockModel.findById(id).select({ subjects: 1 }).lean();

        BlockValidator.ValidateBlockInput({ blockInput: updateBlockInput, subjects: block.subjects, isUpdate: true });

        const updateBlockPayload = BlockHelper.GetUpdateBlockPayload({ updateBlockInput, subjects: block.subjects, userId });



        const updatedBlock = await BlockModel.findOneAndUpdate(
            { _id: id },
            { $set: updateBlockPayload },
            { new: true }
        ).lean();

        if (!updatedBlock) {
            throw new ApolloError('Block update failed', 'BLOCK_UPDATE_FAILED');
        }

        return updatedBlock;
    } catch (error) {
        console.error('Unexpected error in UpdateBlock:', error);

        throw new ApolloError('Failed to update block', 'UPDATE_BLOCK_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to perform a deep, cascading soft delete on a block and all its descendants
 * (subjects, tests, tasks, and student test results).
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the block to delete.
 * @param {object} context - The GraphQL context, used here to get the user ID.
 * @returns {Promise<object>} - A promise that resolves to the block object as it was before being soft-deleted.
 */
async function DeleteBlock(_, { id }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateObjectId(id);

        // *************** Get the payload for deleting a block
        const {
            block,
            subjects,
            tests,
            tasks,
            studentTestResults
        } = await BlockHelper.GetDeleteBlockPayload({ blockId: id, userId });

        // *************** Soft delete student test results if any
        if (studentTestResults) {
            const studentTestResultUpdate = await StudentTestResultModel.updateMany(
                studentTestResults.filter,
                studentTestResults.update
            );
            if (!studentTestResultUpdate.nModified) {
                throw new ApolloError('No student test results matched for deletion', 'STUDENT_RESULTS_NOT_FOUND');
            }
        }

        // *************** Soft delete tasks if any
        if (tasks) {
            const taskUpdate = await TaskModel.updateMany(
                tasks.filter,
                tasks.update
            );
            if (!taskUpdate.nModified) {
                throw new ApolloError('No tasks matched for deletion', 'TASKS_NOT_FOUND');
            }
        }

        // *************** Soft delete tests if any
        if (tests) {
            const testUpdate = await TestModel.updateMany(
                tests.filter,
                tests.update
            );
            if (!testUpdate.nModified) {
                throw new ApolloError('No tests matched for deletion', 'TESTS_NOT_FOUND');
            }
        }

        // *************** Soft delete subjects if any
        if (subjects) {
            const subjectUpdate = await SubjectModel.updateMany(
                subjects.filter,
                subjects.update
            );
            if (!subjectUpdate.nModified) {
                throw new ApolloError('No subjects matched for deletion', 'SUBJECTS_NOT_FOUND');
            }
        }

        // *************** Soft delete the subject itself
        const deletedBlock = await BlockModel.findOneAndUpdate(
            block.filter,
            block.update
        ).lean();

        if (!deletedBlock) {
            throw new ApolloError('Block deletion failed', 'BLOCK_DELETION_FAILED');
        }

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
 * @param {object} parent - The parent object.
 * @param {Array<string>} parent.subjects - An array of subject IDs to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of subject objects.
 */
async function SubjectLoader(parent, _, context) {
    try {
        BlockValidator.ValidateSubjectLoaderInput(parent, context);

        const subjects = await context.dataLoaders.SubjectLoader.loadMany(parent.subjects);

        return subjects;
    } catch (error) {
        console.error("Error fetching subjects:", error);

        throw new ApolloError(`Failed to fetch subjects for ${parent.name}`, 'SUBJECT_FETCH_FAILED', {
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
        BlockValidator.ValidateUserLoaderInput(block, context, 'created_by');

        const createdBy = await context.dataLoaders.UserLoader.load(block.created_by);

        return createdBy;
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
        BlockValidator.ValidateUserLoaderInput(block, context, 'updated_by');

        const updatedBy = await context.dataLoaders.UserLoader.load(block.updated_by);

        return updatedBy;
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
        BlockValidator.ValidateUserLoaderInput(block, context, 'deleted_by');

        const deletedBy = await context.dataLoaders.UserLoader.load(block.deleted_by);

        return deletedBy;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads a single subject document, typically intended for resolving a related field.
 * @param {object} parent - The parent object from the resolver.
 * @param {string} parent.deleted_by - The ID of the subject to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the subject object.
 */
async function SingleSubjectLoader(parent, _, context) {
    try {
        BlockValidator.ValidateSingleSubjectLoaderInput(parent, context);

        const deletedBy = await context.dataLoaders.SubjectLoader.load(parent.deleted_by);

        return deletedBy;
    } catch (error) {
        throw new ApolloError(`Failed to fetch subject: ${error.message}`, 'SUBJECT_FETCH_FAILED', {
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
    },

    BlockPassingCondition: {
        subject: SingleSubjectLoader,
    }
}