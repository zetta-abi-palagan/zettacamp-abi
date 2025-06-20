// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const BlockModel = require('./block.model');
const SubjectModel = require('../subject/subject.model');
const TestModel = require('../test/test.model');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../../shared/validator/index');

/**
 * Creates a clean data payload from a raw block input object.
 * @param {object} createBlockInput - An object containing the block's properties.
 * @param {string} createBlockInput.name - The name of the block.
 * @param {string} createBlockInput.description - The description of the block.
 * @param {string} createBlockInput.evaluation_type - The evaluation method.
 * @param {string} createBlockInput.block_type - The type of block.
 * @param {string} [createBlockInput.connected_block] - Optional. The ID of a related block.
 * @param {boolean} createBlockInput.is_counted_in_final_transcript - Flag indicating if the block affects the final transcript.
 * @param {string} createBlockInput.block_status - The status of the block.
 * @param {string} userId - The ID of the user creating or updating the block.
 * @returns {object} A processed data payload suitable for database operations.
 */
function GetCreateBlockPayload(createBlockInput, userId) {
    CommonValidator.ValidateInputTypeObject(createBlockInput);
    CommonValidator.ValidateObjectId(userId);

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
 * Generates the payload for updating a block with the provided input and user ID.
 * @param {Object} updateBlockInput - The input object containing block details.
 * @param {string} updateBlockInput.name - The name of the block.
 * @param {string} updateBlockInput.description - The description of the block.
 * @param {string} updateBlockInput.evaluation_type - The evaluation type of the block.
 * @param {string} updateBlockInput.block_type - The type of the block.
 * @param {string|number} updateBlockInput.connected_block - The connected block identifier.
 * @param {boolean} updateBlockInput.is_counted_in_final_transcript - Whether the block is counted in the final transcript.
 * @param {string} updateBlockInput.block_status - The status of the block.
 * @param {string} userId - The ID of the user performing the update.
 * @returns {Object} The payload object for updating the block.
 */
function GetUpdateBlockPayload(updateBlockInput, userId) {
    CommonValidator.ValidateInputTypeObject(updateBlockInput);
    CommonValidator.ValidateObjectId(userId);

    const {
        name,
        description,
        evaluation_type,
        block_type,
        connected_block,
        is_counted_in_final_transcript,
        block_status
    } = updateBlockInput;

    return {
        name,
        description,
        evaluation_type: evaluation_type.toUpperCase(),
        block_type: block_type.toUpperCase(),
        connected_block,
        is_counted_in_final_transcript,
        block_status: block_status.toUpperCase(),
        updated_by: userId
    }
}

/**
 * Generates a payload for a deep, cascading soft delete of a block and all its descendants.
 * This includes the block itself, its subjects, their tests, and those tests' tasks and student results.
 * @param {string} id - The unique identifier of the root block to be deleted.
 * @param {string} userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for all required delete operations.
 */
async function GetDeleteBlockPayload(blockId, userId) {
    CommonValidator.ValidateObjectId(blockId);

    const deletionTimestamp = Date.now();

    // *************** Get block and prepare payload
    const block = await BlockModel.findById(blockId);
    if (!block) {
        throw new ApolloError('Block not found', 'BLOCK_NOT_FOUND');
    }

    const subjectIds = block.subjects || [];

    const deleteBlockPayload = {
        block: {
            filter: { _id: blockId },
            update: {
                block_status: 'DELETED',
                updated_at: userId,
                deleted_by: userId,
                deleted_at: deletionTimestamp
            }
        },
        subjects: null,
        tests: null,
        tasks: null,
        studentTestResults: null
    };

    // *************** Handle subjects
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
                updated_at: userId,
                deleted_by: userId,
                deleted_at: deletionTimestamp
            }
        };

        // *************** Handle tests
        if (testIds.length) {
            const areAllTestIdsValid = testIds.every(id => mongoose.Types.ObjectId.isValid(id));
            if (!areAllTestIdsValid) {
                throw new ApolloError('One or more test IDs are invalid', 'INVALID_TEST_ID');
            }

            const tests = await TestModel.find({ _id: { $in: testIds } });
            const allTaskIds = [].concat(...tests.map(test => test.tasks || []));
            const allStudentResultIds = [].concat(...tests.map(test => test.student_test_results || []));

            deleteBlockPayload.tests = {
                filter: { _id: { $in: testIds } },
                update: {
                    test_status: 'DELETED',
                    updated_at: userId,
                    deleted_by: userId,
                    deleted_at: deletionTimestamp
                }
            };

            // *************** Handle tasks
            if (allTaskIds.length) {
                const areAllTaskIdsValid = allTaskIds.every(id => mongoose.Types.ObjectId.isValid(id));
                if (!areAllTaskIdsValid) {
                    throw new ApolloError('One or more task IDs are invalid', 'INVALID_TASK_ID');
                }

                deleteBlockPayload.tasks = {
                    filter: { _id: { $in: allTaskIds } },
                    update: {
                        task_status: 'DELETED',
                        updated_at: userId,
                        deleted_by: userId,
                        deleted_at: deletionTimestamp
                    }
                };
            }

            // *************** Handle student test results
            if (allStudentResultIds.length) {
                const areAllStudentResultIdsValid = allStudentResultIds.every(id => mongoose.Types.ObjectId.isValid(id));
                if (!areAllStudentResultIdsValid) {
                    throw new ApolloError('One or more student test result IDs are invalid', 'INVALID_STUDENT_TEST_RESULT_ID');
                }

                deleteBlockPayload.studentTestResults = {
                    filter: { _id: { $in: allStudentResultIds } },
                    update: {
                        result_status: 'DELETED',
                        updated_at: userId,
                        deleted_by: userId,
                        deleted_at: deletionTimestamp
                    }
                };
            }
        }
    }

    return deleteBlockPayload;
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetCreateBlockPayload,
    GetUpdateBlockPayload,
    GetDeleteBlockPayload,
}