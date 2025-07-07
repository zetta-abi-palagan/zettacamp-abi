// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const BlockModel = require('./block.model');

// *************** IMPORT UTILITES ***************
const CommonHelper = require('../../shared/helper/index')

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../../shared/validator/index');
const BlockValidator = require('./block.validator');

/**
 * Processes and transforms a raw block input object into a structured data payload.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.createBlockInput - The raw input object containing the block's properties.
 * @param {string} args.createBlockInput.name - The name of the block.
 * @param {string} args.createBlockInput.description - The description of the block.
 * @param {string} args.createBlockInput.evaluation_type - The evaluation method (e.g., 'COMPETENCY').
 * @param {string} args.createBlockInput.block_type - The type of block (e.g., 'REGULAR').
 * @param {string} [args.createBlockInput.connected_block] - Optional. The ID of a related block.
 * @param {boolean} args.createBlockInput.is_counted_in_final_transcript - Flag for final transcript inclusion.
 * @param {string} args.createBlockInput.block_status - The initial status of the block (e.g., 'ACTIVE').
 * @param {string} args.userId - The ID of the user creating the block.
 * @returns {object} A processed data payload suitable for a database create operation.
 */
function GetCreateBlockPayload({ createBlockInput, userId }) {
    CommonValidator.ValidateInputTypeObject(createBlockInput);
    CommonValidator.ValidateObjectId(userId);
    BlockValidator.ValidateBlockInput({ blockInput: createBlockInput });

    const {
        name,
        description,
        evaluation_type,
        block_type,
        connected_block,
        is_counted_in_final_transcript,
        block_status
    } = createBlockInput;

    return {
        name,
        description,
        evaluation_type: evaluation_type.toUpperCase(),
        block_type: block_type.toUpperCase(),
        connected_block,
        is_counted_in_final_transcript,
        block_status: block_status.toUpperCase(),
        created_by: userId,
        updated_by: userId
    }
}

/**
 * Processes and transforms a raw block input object into a structured data payload for a partial update operation.
 * It only includes fields that are explicitly provided in the input.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.updateBlockInput - The raw input object containing the block's properties to update.
 * @param {Array<object>} args.subjects - The existing subjects of the block, used for validation.
 * @param {string} args.userId - The ID of the user updating the block.
 * @returns {object} A processed data payload suitable for a partial database update operation.
 */
function GetUpdateBlockPayload({ updateBlockInput, subjects, userId }) {
    CommonValidator.ValidateInputTypeObject(updateBlockInput);
    CommonValidator.ValidateObjectId(userId);
    BlockValidator.ValidateBlockInput({ blockInput: updateBlockInput, subjects, isUpdate: true });

    const {
        name,
        description,
        evaluation_type,
        block_type,
        connected_block,
        is_counted_in_final_transcript,
        block_status,
        block_passing_criteria
    } = updateBlockInput;

    const payload = {
        name: name ? name : undefined,
        description: description ? description : undefined,
        evaluation_type: evaluation_type ? evaluation_type.toUpperCase() : undefined,
        block_type: block_type ? block_type.toUpperCase() : undefined,
        connected_block: connected_block ? connected_block : undefined,
        is_counted_in_final_transcript: is_counted_in_final_transcript ? is_counted_in_final_transcript : undefined,
        block_status: block_status ? block_status.toUpperCase() : undefined,
        block_passing_criteria: block_passing_criteria ? block_passing_criteria : undefined,
        updated_by: userId
    };

    return payload;
}

/**
 * Orchestrates the generation of a payload for a deep, cascading soft delete of a block and all its descendants.
 * @param {object} args - The arguments for getting the delete payload.
 * @param {string} args.blockId - The unique identifier of the root block to be deleted.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for all required delete operations.
 */
async function GetDeleteBlockPayload({ blockId, userId }) {
    try {
        CommonValidator.ValidateObjectId(blockId);
        CommonValidator.ValidateObjectId(userId);

        const deletionTimestamp = Date.now();

        const block = await BlockModel.findOne({ _id: blockId, block_status: { $ne: 'DELETED' } });
        if (!block) {
            throw new ApolloError('Block not found', 'BLOCK_NOT_FOUND');
        }

        const subjectIds = block.subjects || [];

        const deleteBlockPayload = {
            block: CommonHelper.BuildDeletePayload({
                ids: [blockId],
                statusKey: 'block_status',
                timestamp: deletionTimestamp,
                userId
            }),
            subjects: null,
            tests: null,
            tasks: null,
            studentTestResults: null
        };

        if (!subjectIds.length) return deleteBlockPayload;

        const { subjectPayload, testIds } = await CommonHelper.HandleDeleteSubjects({ subjectIds, userId, timestamp: deletionTimestamp });
        deleteBlockPayload.subjects = subjectPayload;

        if (!testIds.length) return deleteBlockPayload;

        const { testPayload, taskIds, studentResultIds } = await CommonHelper.HandleDeleteTests({ testIds, userId, timestamp: deletionTimestamp });
        deleteBlockPayload.tests = testPayload;

        if (taskIds.length) {
            deleteBlockPayload.tasks = CommonHelper.HandleDeleteTasks({ taskIds, userId, timestamp: deletionTimestamp });
        }

        if (studentResultIds.length) {
            deleteBlockPayload.studentTestResults = CommonHelper.HandleDeleteStudentTestResults({ resultIds: studentResultIds, userId, timestamp: deletionTimestamp });
        }

        return deleteBlockPayload;
    } catch (error) {
        throw new ApolloError(`Failed in GetDeleteBlockPayload: ${error.message}`, 'DELETE_BLOCK_PAYLOAD_FAILED', {
            error: error.message
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetCreateBlockPayload,
    GetUpdateBlockPayload,
    GetDeleteBlockPayload,
}