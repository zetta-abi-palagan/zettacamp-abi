// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const BlockModel = require('./block.model');
const SubjectModel = require('../subject/subject.model');

// *************** IMPORT VALIDATOR ***************
const GlobalValidator = require('../../shared/validator/index');

/**
 * Creates a clean data payload from a raw block input object.
 * @param {object} BlockInput - An object containing the block's properties.
 * @param {string} BlockInput.name - The name of the block.
 * @param {string} BlockInput.description - The description of the block.
 * @param {string} BlockInput.evaluation_type - The evaluation method.
 * @param {string} BlockInput.block_type - The type of block.
 * @param {string} [BlockInput.connected_block] - Optional. The ID of a related block.
 * @param {boolean} BlockInput.is_counted_in_final_transcript - Flag indicating if the block affects the final transcript.
 * @param {string} BlockInput.block_status - The status of the block.
 * @returns {object} A processed data payload suitable for database operations.
 */
function GetBlockPayload(BlockInput) {
    GlobalValidator.ValidateInputTypeObject(BlockInput);

    const {
        name,
        description,
        evaluation_type,
        block_type,
        connected_block,
        is_counted_in_final_transcript,
        block_status
    } = BlockInput;

    // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
    const createdByUserId = '6846e5769e5502fce150eb67';

    return {
        name,
        description,
        evaluation_type: evaluation_type.toUpperCase(),
        block_type: block_type.toUpperCase(),
        connected_block,
        is_counted_in_final_transcript,
        block_status: block_status.toUpperCase(),
        created_by: createdByUserId,
        updated_by: createdByUserId
    }
}

/**
 * Generates a payload with filter and update documents for a cascading soft delete of a block, its subjects, and their tests.
 * @param {string} id - The unique identifier of the block to be deleted.
 * @returns {Promise<object>} A promise that resolves to a structured payload for the delete operations.
 */
async function GetDeleteBlockPayload(id) {
    GlobalValidator.ValidateObjectId(id);

    // *************** Dummy user ID (replace with real one later)
    const deletedByUserId = '6846e5769e5502fce150eb67';
    const deletionTimestamp = Date.now();

    const block = await BlockModel.findById(id);
    if (!block) {
        throw new ApolloError('Block not found', 'BLOCK_NOT_FOUND');
    }

    const subjectIds = block.subjects || [];

    const deleteBlockPayload = {
        block: {
            filter: { _id: id },
            update: {
                block_status: 'DELETED',
                updated_at: deletedByUserId,
                deleted_by: deletedByUserId,
                deleted_at: deletionTimestamp
            }
        },
        subjects: null,
        tests: null
    };

    if (subjectIds.length) {
        const areAllSubjectIdsValid = subjectIds.every(id => mongoose.Types.ObjectId.isValid(id));
        if (!areAllSubjectIdsValid) {
            throw new ApolloError('One or more subject IDs are invalid', 'INVALID_SUBJECT_ID');
        }

        const subjects = await SubjectModel.find({ _id: { $in: subjectIds } });
        const testIds = [].concat(...subjects.map(subject => subject.tests || []));

        deleteBlockPayload.subjects = {
            filter: { _id: { $in: subjectIds } },
            update: {
                subject_status: 'DELETED',
                updated_at: deletedByUserId,
                deleted_by: deletedByUserId,
                deleted_at: deletionTimestamp
            }
        };

        if (testIds.length) {
            const areAllTestIdsValid = testIds.every(id => mongoose.Types.ObjectId.isValid(id));
            if (!areAllTestIdsValid) {
                throw new ApolloError('One or more test IDs are invalid', 'INVALID_TEST_ID');
            }

            deleteBlockPayload.tests = {
                filter: { _id: { $in: testIds } },
                update: {
                    test_status: 'DELETED',
                    updated_at: deletedByUserId,
                    deleted_by: deletedByUserId,
                    deleted_at: deletionTimestamp
                }
            };
        }
    }

    return deleteBlockPayload;
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetBlockPayload,
    GetDeleteBlockPayload,
}