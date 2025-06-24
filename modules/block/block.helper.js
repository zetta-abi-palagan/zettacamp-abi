// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const BlockModel = require('./block.model');
const SubjectModel = require('../subject/subject.model');
const TestModel = require('../test/test.model');

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
    BlockValidator.ValidateBlockInput(createBlockInput);

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
 * Processes and transforms a raw block input object into a structured data payload for an update operation.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.updateBlockInput - The raw input object containing the block's properties to update.
 * @param {string} args.updateBlockInput.name - The name of the block.
 * @param {string} args.updateBlockInput.description - The description of the block.
 * @param {string} args.updateBlockInput.evaluation_type - The evaluation method (e.g., 'COMPETENCY').
 * @param {string} args.updateBlockInput.block_type - The type of block (e.g., 'REGULAR').
 * @param {string} [args.updateBlockInput.connected_block] - Optional. The ID of a related block.
 * @param {boolean} args.updateBlockInput.is_counted_in_final_transcript - Flag for final transcript inclusion.
 * @param {string} args.updateBlockInput.block_status - The status of the block (e.g., 'ACTIVE').
 * @param {string} args.userId - The ID of the user updating the block.
 * @returns {object} A processed data payload suitable for a database update operation.
 */
function GetUpdateBlockPayload({ updateBlockInput, userId }) {
    CommonValidator.ValidateInputTypeObject(updateBlockInput);
    CommonValidator.ValidateObjectId(userId);
    BlockValidator.ValidateBlockInput(updateBlockInput);

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
 * Orchestrates the generation of a payload for a deep, cascading soft delete of a block and all its descendants.
 * @param {object} args - The arguments for getting the delete payload.
 * @param {string} args.blockId - The unique identifier of the root block to be deleted.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for all required delete operations.
 */
async function GetDeleteBlockPayload({ blockId, userId }) {
    CommonValidator.ValidateObjectId(blockId);
    CommonValidator.ValidateObjectId(userId);

    const deletionTimestamp = Date.now();
    const block = await GetBlock(blockId);
    const subjectIds = block.subjects || [];

    const deleteBlockPayload = {
        block: BuildDeletePayload({ ids: [blockId], statusKey: 'block_status', timestamp: deletionTimestamp, userId }),
        subjects: null,
        tests: null,
        tasks: null,
        studentTestResults: null
    };

    if (!subjectIds.length) return deleteBlockPayload;

    const { subjectPayload, testIds } = await HandleDeleteSubjects({ subjectIds, userId, timestamp: deletionTimestamp });
    deleteBlockPayload.subjects = subjectPayload;

    if (!testIds.length) return deleteBlockPayload;

    const { testPayload, taskIds, studentResultIds } = await HandleDeleteTests({ testIds, userId, timestamp: deletionTimestamp });
    deleteBlockPayload.tests = testPayload;

    if (taskIds.length) {
        deleteBlockPayload.tasks = HandleDeleteTasks({ taskIds, userId, timestamp: deletionTimestamp });
    }

    if (studentResultIds.length) {
        deleteBlockPayload.studentTestResults = HandleDeleteStudentTestResults({ resultIds: studentResultIds, userId, timestamp: deletionTimestamp });
    }

    return deleteBlockPayload;
}

/**
 * A generic utility to build a standard soft-delete deleteBlockPayload object.
 * @param {object} args - The arguments for building the payload.
 * @param {Array<string>} args.ids - An array of document IDs to target.
 * @param {string} args.statusKey - The name of the status field to be updated (e.g., 'block_status').
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {object} An object containing 'filter' and 'update' properties for a database operation.
 */
function BuildDeletePayload({ ids, statusKey, timestamp, userId }) {
    return {
        filter: { _id: { $in: ids } },
        update: {
            [statusKey]: 'DELETED',
            updated_at: userId,
            deleted_by: userId,
            deleted_at: timestamp
        }
    };
}

/**
 * Fetches a single block document by its ID.
 * @param {string} blockId - The ID of the block to fetch.
 * @returns {Promise<object>} A promise that resolves to the found block document.
 */
async function GetBlock(blockId) {
    const block = await BlockModel.findById(blockId);
    if (!block) {
        throw new ApolloError('Block not found', 'BLOCK_NOT_FOUND');
    }
    return block;
}

/**
 * Handles the processing of subject IDs for deletion, creating a payload and collecting descendant test IDs.
 * @param {object} args - The arguments for handling subject deletion.
 * @param {Array<string>} args.subjectIds - An array of subject IDs to process.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @returns {Promise<object>} A promise that resolves to an object containing the subject delete payload and an array of test IDs.
 */
async function HandleDeleteSubjects({ subjectIds, userId, timestamp }) {
    CommonValidator.ValidateObjectIdArray(subjectIds, 'INVALID_SUBJECT_ID');

    const subjects = await SubjectModel.find({ _id: { $in: subjectIds } });
    const testIds = [].concat(...subjects.map(subject => subject.tests || []));

    const subjectPayload = BuildDeletePayload({
        ids: subjectIds,
        statusKey: 'subject_status',
        timestamp,
        userId
    });

    return { subjectPayload, testIds };
}

/**
 * Handles the processing of test IDs for deletion, creating a payload and collecting descendant task and result IDs.
 * @param {object} args - The arguments for handling test deletion.
 * @param {Array<string>} args.testIds - An array of test IDs to process.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @returns {Promise<object>} A promise that resolves to an object containing the test delete payload, an array of task IDs, and an array of student result IDs.
 */
async function HandleDeleteTests({ testIds, userId, timestamp }) {
    CommonValidator.ValidateObjectIdArray(testIds, 'INVALID_TEST_ID');

    const tests = await TestModel.find({ _id: { $in: testIds } });
    const taskIds = [].concat(...tests.map(test => test.tasks || []));
    const studentResultIds = [].concat(...tests.map(test => test.student_test_results || []));

    const testPayload = BuildDeletePayload({
        ids: testIds,
        statusKey: 'test_status',
        timestamp,
        userId
    });

    return { testPayload, taskIds, studentResultIds };
}

/**
 * Handles the processing of task IDs for deletion and creates the corresponding payload.
 * @param {object} args - The arguments for handling task deletion.
 * @param {Array<string>} args.taskIds - An array of task IDs to process.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @returns {object} An object containing the 'filter' and 'update' payload for tasks.
 */
function HandleDeleteTasks({ taskIds, userId, timestamp }) {
    CommonValidator.ValidateObjectIdArray(taskIds, 'INVALID_TASK_ID');

    return BuildDeletePayload({
        ids: taskIds,
        statusKey: 'task_status',
        timestamp,
        userId
    });
}

/**
 * Handles the processing of student test result IDs for deletion and creates the corresponding payload.
 * @param {object} args - The arguments for handling student test result deletion.
 * @param {Array<string>} args.resultIds - An array of student test result IDs to process.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @returns {object} An object containing the 'filter' and 'update' payload for student test results.
 */
function HandleDeleteStudentTestResults({ resultIds, userId, timestamp }) {
    CommonValidator.ValidateObjectIdArray(resultIds, 'INVALID_STUDENT_TEST_RESULT_ID');

    return BuildDeletePayload({
        ids: resultIds,
        statusKey: 'student_test_result_status',
        timestamp,
        userId
    });
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetCreateBlockPayload,
    GetUpdateBlockPayload,
    GetDeleteBlockPayload,
}