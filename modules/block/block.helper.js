// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const BlockModel = require('./block.model');
const SubjectModel = require('../subject/subject.model');

// *************** IMPORT VALIDATOR ***************
const validator = require('./block.validator');

/**
 * Fetches all blocks from the database, with an optional filter for block status.
 * @param {string} block_status - Optional. The status of the blocks to fetch (e.g., 'ACTIVE'). If not provided, blocks with any status are returned.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of block objects.
 */
async function GetAllBlocksHelper(block_status) {
    try {
        validator.ValidateGetAllBlocksInput(block_status);

        const filter = {};

        if (block_status) {
            filter.block_status = block_status;
        }

        const blocks = await BlockModel.find(filter);

        return blocks;
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
        validator.ValidateGetOneBlockInput(id);

        const block = await BlockModel.findOne({ _id: id });

        return block;
    } catch (error) {
        throw new ApolloError(`Failed to fetch block: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Creates a new block after validating the provided data.
 * @param {string} name - The name of the block.
 * @param {string} description - The description of the block.
 * @param {string} evaluation_type - The evaluation methodology (e.g., 'COMPETENCY', 'SCORE').
 * @param {string} block_type - The type of block (e.g., 'REGULAR', 'RETAKE').
 * @param {string} connected_block - The ID of a related block, required if block_type is 'RETAKE'.
 * @param {boolean} is_counted_in_final_transcript - Flag to indicate if the block affects the final transcript.
 * @param {string} block_status - The initial status of the block (e.g., 'ACTIVE').
 * @returns {Promise<object>} - A promise that resolves to the newly created block object.
 */
async function CreateBlockHelper(name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status) {
    try {
        validator.ValidateCreateBlockInput(name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status);

        const competencyBlockTypes = ['COMPETENCY', 'SOFT_SKILL', 'ACADEMIC_RECOMMENDATION', 'RETAKE'];
        const scoreBlockTypes = ['REGULAR', 'TRANSVERSAL', 'SPECIALIZATION', 'RETAKE'];

        if (typeof evaluation_type !== 'string') {
            throw new ApolloError('Invalid evaluation_type: must be a string.', 'INTERNAL_LOGIC_ERROR');
        }
        if (typeof block_type !== 'string') {
            throw new ApolloError('Invalid block_type: must be a string.', 'INTERNAL_LOGIC_ERROR');
        }

        const upperEvalType = evaluation_type.toUpperCase();
        const upperBlockType = block_type.toUpperCase();

        if (
            (upperEvalType === 'COMPETENCY' && !competencyBlockTypes.includes(upperBlockType)) ||
            (upperEvalType === 'SCORE' && !scoreBlockTypes.includes(upperBlockType))
        ) {
            throw new ApolloError(
                `Invalid combination: ${upperEvalType} evaluation cannot be used with ${upperBlockType} block type.`,
                'LOGIC_SANITY_ERROR'
            );
        }

        if (connected_block && block_type.toUpperCase() !== 'RETAKE') {
            throw new ApolloError('Block type must be RETAKE to have a connected block.', 'BAD_USER_INPUT', {
                field: 'connected_block'
            });
        }

        if (typeof block_status !== 'string') {
            throw new ApolloError('Invalid block_status: must be a string.', 'INTERNAL_LOGIC_ERROR');
        }

        const upperBlockStatus = block_status.toUpperCase()

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const createdByUserId = '6846e5769e5502fce150eb67';

        const blockData = {
            name: name,
            description: description,
            evaluation_type: upperEvalType,
            block_type: upperBlockType,
            connected_block: connected_block,
            is_counted_in_final_transcript: is_counted_in_final_transcript,
            block_status: upperBlockStatus,
            created_by: createdByUserId,
            updated_by: createdByUserId
        };
        const newBlock = await BlockModel.create(blockData);

        if (!newBlock) {
            throw new ApolloError('Block Creation failed', 'BLOCK_CREATION_FAILED');
        }

        return newBlock;
    } catch (error) {
        throw new ApolloError('Failed to create block', 'BLOCK_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * Updates an existing block after validating the provided data.
 * @param {string} id - The unique identifier of the block to be updated.
 * @param {string} name - The name of the block.
 * @param {string} description - The description of the block.
 * @param {string} evaluation_type - The evaluation methodology (e.g., 'COMPETENCY', 'SCORE').
 * @param {string} block_type - The type of block (e.g., 'REGULAR', 'RETAKE').
 * @param {string} connected_block - The ID of a related block, required if block_type is 'RETAKE'.
 * @param {boolean} is_counted_in_final_transcript - Flag to indicate if the block affects the final transcript.
 * @param {string} block_status - The status of the block (e.g., 'ACTIVE').
 * @returns {Promise<object>} - A promise that resolves to the updated block object.
 */
async function UpdateBlockHelper(id, name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status) {
    try {
        validator.ValidateUpdateBlockInput(id, name, description, evaluation_type, block_type, connected_block, is_counted_in_final_transcript, block_status)

        const competencyBlockTypes = ['COMPETENCY', 'SOFT_SKILL', 'ACADEMIC_RECOMMENDATION', 'RETAKE'];
        const scoreBlockTypes = ['REGULAR', 'TRANSVERSAL', 'SPECIALIZATION', 'RETAKE'];

        if (typeof evaluation_type !== 'string') {
            throw new ApolloError('Invalid evaluation_type: must be a string.', 'INTERNAL_LOGIC_ERROR');
        }
        if (typeof block_type !== 'string') {
            throw new ApolloError('Invalid block_type: must be a string.', 'INTERNAL_LOGIC_ERROR');
        }

        const upperEvalType = evaluation_type.toUpperCase();
        const upperBlockType = block_type.toUpperCase();

        if (
            (upperEvalType === 'COMPETENCY' && !competencyBlockTypes.includes(upperBlockType)) ||
            (upperEvalType === 'SCORE' && !scoreBlockTypes.includes(upperBlockType))
        ) {
            throw new ApolloError(
                `Invalid combination: ${upperEvalType} evaluation cannot be used with ${upperBlockType} block type.`,
                'LOGIC_SANITY_ERROR'
            );
        }

        if (connected_block && block_type.toUpperCase() !== 'RETAKE') {
            throw new ApolloError('Block type must be RETAKE to have a connected block.', 'BAD_USER_INPUT', {
                field: 'connected_block'
            });
        }

        if (typeof block_status !== 'string') {
            throw new ApolloError('Invalid block_status: must be a string.', 'INTERNAL_LOGIC_ERROR');
        }

        const upperBlockStatus = block_status.toUpperCase()

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const updatedByUserId = '6846e5769e5502fce150eb67';

        const blockData = {
            name: name,
            description: description,
            evaluation_type: upperEvalType,
            block_type: upperBlockType,
            connected_block: connected_block,
            is_counted_in_final_transcript: is_counted_in_final_transcript,
            block_status: upperBlockStatus,
            updated_by: updatedByUserId
        }

        const updatedBlock = await BlockModel.findOneAndUpdate({ _id: id }, blockData, { new: true });

        if (!updatedBlock) {
            throw new ApolloError('Block update failed', 'BLOCK_UPDATE_FAILED');
        }

        return updatedBlock;
    } catch (error) {
        throw new ApolloError('Failed to update block', 'BLOCK_UPDATE_FAILED', {
            error: error.message
        });
    }
}

/**
 * Performs a deep cascading soft delete on a block, its associated subjects, and their associated tests.
 * @param {string} id - The unique identifier of the block to be deleted.
 * @returns {Promise<object>} - A promise that resolves to the block object as it was before being updated.
 */
async function DeleteBlockHelper(id) {
    try {
        validator.ValidateDeleteBlockInput(id);

        // *************** Dummy user ID (replace with real one later)
        const deletedByUserId = '6846e5769e5502fce150eb67';
        const deletionTimestamp = Date.now();

        // *************** Fetch the block to get its associated subjects
        const block = await BlockModel.findById(id);
        if (!block) {
            throw new ApolloError('Block not found', 'BLOCK_NOT_FOUND');
        }

        const subjectIds = block.subjects || [];

        if (subjectIds.length) {
            const areAllSubjectIdsValid = subjectIds.every(id => mongoose.Types.ObjectId.isValid(id));
            if (!areAllSubjectIdsValid) {
                throw new ApolloError('One or more subject IDs are invalid', 'INVALID_SUBJECT_ID');
            }

            // *************** Fetch all subjects to get associated test IDs
            const subjects = await SubjectModel.find({ _id: { $in: subjectIds } });

            const testIds = [].concat(...subjects.map(subject => subject.tests || []));

            if (testIds.length) {
                const areAllTestIdsValid = testIds.every(id => mongoose.Types.ObjectId.isValid(id));
                if (!areAllTestIdsValid) {
                    throw new ApolloError('One or more test IDs are invalid', 'INVALID_TEST_ID');
                }

                await TestModel.updateMany(
                    { _id: { $in: testIds } },
                    {
                        test_status: 'DELETED',
                        updated_at: deletedByUserId,
                        deleted_by: deletedByUserId,
                        deleted_at: deletionTimestamp
                    }
                );
            }

            await SubjectModel.updateMany(
                { _id: { $in: subjectIds } },
                {
                    subject_status: 'DELETED',
                    updated_at: deletedByUserId,
                    deleted_by: deletedByUserId,
                    deleted_at: deletionTimestamp
                }
            );
        }

        // *************** Soft delete the block
        const deletedBlock = await BlockModel.findOneAndUpdate(
            { _id: id },
            {
                block_status: 'DELETED',
                updated_at: deletedByUserId,
                deleted_by: deletedByUserId,
                deleted_at: deletionTimestamp
            }
        );

        if (!deletedBlock) {
            throw new ApolloError('Block deletion failed', 'BLOCK_DELETION_FAILED');
        }

        return deletedBlock;
    } catch (error) {
        throw new ApolloError('Failed to delete block', 'BLOCK_DELETION_FAILED', {
            error: error.message
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetAllBlocksHelper,
    GetOneBlockHelper,
    CreateBlockHelper,
    UpdateBlockHelper,
    DeleteBlockHelper
}