// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const SubjectModel = require('./subject.model');
const TestModel = require('../test/test.model');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../../shared/validator/index');
const SubjectValidator = require('./subject.validator');

/**
 * Processes and transforms a raw subject input object into a structured data payload for a create operation.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.subjectInput - The raw input object containing the subject's properties.
 * @param {string} args.subjectInput.block - The ID of the parent block.
 * @param {string} args.subjectInput.name - The name of the subject.
 * @param {string} args.subjectInput.description - The description of the subject.
 * @param {number} args.subjectInput.coefficient - The coefficient value for the subject.
 * @param {string} args.subjectInput.subject_status - The initial status of the subject.
 * @param {boolean} args.isTransversal - A flag indicating if the subject is transversal.
 * @param {string} args.userId - The ID of the user creating the subject.
 * @returns {object} A processed data payload suitable for a database create operation.
 */
function GetCreateSubjectPayload({ subjectInput, isTransversal, userId }) {
    CommonValidator.ValidateInputTypeObject(subjectInput);
    CommonValidator.ValidateObjectId(userId);
    SubjectValidator.ValidateSubjectInput({ subjectInput, isTransversal });

    const {
        block,
        name,
        description,
        coefficient,
        subject_status
    } = subjectInput;

    return {
        block,
        name,
        description,
        coefficient,
        is_transversal: isTransversal,
        subject_status: subject_status.toUpperCase(),
        created_by: userId,
        updated_by: userId
    };
}

/**
 * Processes and transforms a raw subject input object into a structured data payload for an update operation.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.subjectInput - The raw input object containing the subject's properties to update.
 * @param {string} args.subjectInput.name - The name of the subject.
 * @param {string} args.subjectInput.description - The description of the subject.
 * @param {number} args.subjectInput.coefficient - The coefficient value for the subject.
 * @param {Array<string>} [args.subjectInput.connected_blocks] - Optional. An array of connected block IDs.
 * @param {string} args.subjectInput.subject_status - The status of the subject.
 * @param {string} args.userId - The ID of the user updating the subject.
 * @param {boolean} args.isTransversal - A flag indicating if the subject is transversal.
 * @returns {object} A processed data payload suitable for a database update operation.
 */
function GetUpdateSubjectPayload({ subjectInput, userId, isTransversal }) {
    CommonValidator.ValidateInputTypeObject(subjectInput);
    CommonValidator.ValidateObjectId(userId);
    SubjectValidator.ValidateSubjectInput({ subjectInput, isTransversal, isUpdate: true });

    const {
        name,
        description,
        coefficient,
        connected_blocks,
        subject_status
    } = subjectInput;

    return {
        name,
        description,
        coefficient,
        connected_blocks,
        subject_status: subject_status ? subject_status.toUpperCase() : undefined,
        updated_by: userId
    };
}

/**
 * Generates a payload for a deep, cascading soft delete of a subject and its descendants.
 * @param {object} args - The arguments for getting the delete payload.
 * @param {string} args.subjectId - The unique identifier of the root subject to be deleted.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for all required delete and update operations.
 */
async function GetDeleteSubjectPayload({ subjectId, userId }) {
    try {
        CommonValidator.ValidateObjectId(subjectId);
        CommonValidator.ValidateObjectId(userId);

        const deletionTimestamp = Date.now();
        const subject = await GetSubject(subjectId);
        const blockId = subject.block;
        const testIds = subject.tests || [];

        const deleteSubjectPayload = {
            subject: BuildDeletePayload({
                ids: [subjectId],
                statusKey: 'subject_status',
                timestamp: deletionTimestamp,
                userId
            }),
            block: BuildPullSubjectFromBlockPayload({ subjectId, blockId }),
            tests: null,
            tasks: null,
            studentTestResults: null
        };

        if (!testIds.length) return deleteSubjectPayload;

        const { testPayload, taskIds, studentResultIds } = await HandleDeleteTests({
            testIds,
            userId,
            timestamp: deletionTimestamp
        });
        deleteSubjectPayload.tests = testPayload;

        if (taskIds.length) {
            deleteSubjectPayload.tasks = HandleDeleteTasks({
                taskIds,
                userId,
                timestamp: deletionTimestamp
            });
        }

        if (studentResultIds.length) {
            deleteSubjectPayload.studentTestResults = HandleDeleteStudentTestResults({
                resultIds: studentResultIds,
                userId,
                timestamp: deletionTimestamp
            });
        }

        return deleteSubjectPayload;
    } catch (error) {
        throw new ApolloError(`Failed to build delete subject payload: ${error.message}`, 'GET_DELETE_SUBJECT_PAYLOAD_FAILED', {
            error: error.message
        });
    }
}

/**
 * Fetches a single subject document by its ID.
 * @param {string} subjectId - The ID of the subject to fetch.
 * @returns {Promise<object>} A promise that resolves to the found subject document.
 */
async function GetSubject(subjectId) {
    try {
        const subject = await SubjectModel.findOne({ _id: subjectId, subject_status: { $ne: 'DELETED' } });
        if (!subject) {
            throw new ApolloError('Subject not found', 'SUBJECT_NOT_FOUND');
        }
        return subject;
    } catch (error) {
        throw new ApolloError(`Failed to get subject: ${error.message}`, 'GET_SUBJECT_FAILED', {
            error: error.message
        });
    }
}

/**
 * A generic utility to build a standard soft-delete payload object.
 * @param {object} args - The arguments for building the payload.
 * @param {Array<string>} args.ids - An array of document IDs to target.
 * @param {string} args.statusKey - The name of the status field to be updated (e.g., 'subject_status').
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {object} An object containing 'filter' and 'update' properties for a database operation.
 */
function BuildDeletePayload({ ids, statusKey, timestamp, userId }) {
    return {
        filter: { _id: { $in: ids } },
        update: {
            [statusKey]: 'DELETED',
            updated_by: userId,
            deleted_by: userId,
            deleted_at: timestamp
        }
    };
}

/**
 * Builds a payload for removing a subject's ID from a block's 'subjects' array.
 * @param {object} args - The arguments for building the payload.
 * @param {string} args.subjectId - The ID of the subject to remove.
 * @param {string} args.blockId - The ID of the block to update.
 * @returns {object} An object containing 'filter' and 'update' properties for a MongoDB $pull operation.
 */
function BuildPullSubjectFromBlockPayload({ subjectId, blockId }) {
    return {
        filter: { _id: blockId },
        update: { $pull: { subjects: subjectId } }
    };
}

/**
 * Handles the processing of test IDs for deletion, creating a payload and collecting descendant task and result IDs.
 * @param {object} args - The arguments for handling test deletion.
 * @param {Array<string>} args.testIds - An array of test IDs to process.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @returns {Promise<object>} A promise that resolves to an object containing the test delete payload, task IDs, and student result IDs.
 */
async function HandleDeleteTests({ testIds, userId, timestamp }) {
    try {
        CommonValidator.ValidateObjectIdArray(testIds, 'INVALID_TEST_ID');

        const tests = await TestModel.find({ _id: { $in: testIds } });

        if (!tests.length) {
            throw new ApolloError('No matching tests found', 'TESTS_NOT_FOUND');
        }

        const taskIds = [].concat(...tests.map(test => test.tasks || []));
        const studentResultIds = [].concat(...tests.map(test => test.student_test_results || []));

        const testPayload = BuildDeletePayload({
            ids: testIds,
            statusKey: 'test_status',
            timestamp,
            userId
        });

        return { testPayload, taskIds, studentResultIds };
    } catch (error) {
        throw new ApolloError(`Failed to handle delete tests: ${error.message}`, 'HANDLE_DELETE_TESTS_FAILED', {
            error: error.message,
        });
    }
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
    GetCreateSubjectPayload,
    GetUpdateSubjectPayload,
    GetDeleteSubjectPayload
}