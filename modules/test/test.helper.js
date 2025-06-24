// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const TestModel = require('./test.model');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../../shared/validator/index');
const TestValidator = require('./test.validator');

/**
 * Processes and transforms a raw test input object into a structured data payload for a create operation.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.testInput - The raw input object containing the test's properties.
 * @param {string} args.userId - The ID of the user creating the test.
 * @param {string} args.evaluationType - The evaluation type of the parent block.
 * @returns {object} A processed data payload suitable for a database create operation.
 */
function GetCreateTestPayload({ testInput, userId, evaluationType }) {
    CommonValidator.ValidateInputTypeObject(testInput);
    CommonValidator.ValidateObjectId(userId);
    TestValidator.ValidateTestInput({ testInput, evaluationType });

    const {
        subject,
        name,
        description,
        test_type,
        result_visibility,
        weight,
        correction_type,
        notations,
        is_retake,
        connected_test,
        test_status
    } = testInput;

    return {
        subject: subject,
        name: name,
        description: description,
        test_type: test_type.toUpperCase(),
        result_visibility: result_visibility.toUpperCase(),
        weight: weight,
        correction_type: correction_type.toUpperCase(),
        notations: notations,
        is_retake: is_retake,
        connected_test: connected_test,
        test_status: test_status.toUpperCase(),
        created_by: userId,
        updated_by: userId
    };
}

/**
 * Processes and transforms a raw test input object into a structured data payload for an update operation.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.testInput - The raw input object containing the test's properties to update.
 * @param {string} args.userId - The ID of the user updating the test.
 * @param {string} args.evaluationType - The evaluation type of the parent block.
 * @returns {object} A processed data payload suitable for a database update operation.
 */
function GetUpdateTestPayload({ testInput, userId, evaluationType }) {
    CommonValidator.ValidateInputTypeObject(testInput);
    CommonValidator.ValidateObjectId(userId);
    TestValidator.ValidateTestInput({ testInput, evaluationType, isUpdate: true });

    const {
        name,
        description,
        test_type,
        result_visibility,
        weight,
        correction_type,
        notations,
        is_retake,
        connected_test,
        test_status
    } = testInput;

    return {
        name,
        description,
        test_type: test_type ? test_type.toUpperCase() : undefined,
        result_visibility: result_visibility ? result_visibility.toUpperCase() : undefined,
        weight,
        correction_type: correction_type ? correction_type.toUpperCase() : undefined,
        notations,
        is_retake,
        connected_test,
        test_status: test_status ? test_status.toUpperCase() : undefined,
        updated_by: userId
    };
}

/**
 * Creates the payload for publishing a test.
 * @param {object} args - The arguments for the publish payload.
 * @param {string} args.userId - The ID of the user publishing the test.
 * @param {Date|string} args.testDueDate - The due date for the test.
 * @returns {object} A data payload for updating the test's published status.
 */
function GetPublishTestPayload({ userId, testDueDate }) {
    CommonValidator.ValidateObjectId(userId);

    return {
        is_published: true,
        published_date: Date.now(),
        published_by: userId,
        test_due_date: testDueDate,
    };
}

/**
 * Creates the payload for a new 'ASSIGN_CORRECTOR' task.
 * @param {object} args - The arguments for the task payload.
 * @param {object} args.testId - The ID of the just published test.
 * @param {Date|string} args.assignCorrectorDueDate - The due date for the new task.
 * @param {string} args.userId - The ID of the user who initiated the publish action.
 * @returns {object} A data payload for creating the new task.
 */
function GetAssignCorrectorTaskPayload({ testId, assignCorrectorDueDate, userId, academicDirectorId }) {
    CommonValidator.ValidateObjectId(testId)
    CommonValidator.ValidateObjectId(userId);
    CommonValidator.ValidateObjectId(academicDirectorId);

    return {
        test: testId,
        user: academicDirectorId,
        title: 'Assign Corrector',
        description: 'Academic Director should assign corrector for student test',
        task_type: 'ASSIGN_CORRECTOR',
        task_status: 'PENDING',
        due_date: assignCorrectorDueDate,
        created_by: userId,
        updated_by: userId
    };
}

/**
 * Generates a payload for a cascading soft delete of a test and its descendants.
 * @param {object} args - The arguments for getting the delete payload.
 * @param {string} args.testId - The unique identifier of the test to be deleted.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for all required delete and update operations.
 */
async function GetDeleteTestPayload({ testId, userId }) {
    try {
        CommonValidator.ValidateObjectId(testId);
        CommonValidator.ValidateObjectId(userId);

        const deletionTimestamp = Date.now();
        const test = await GetTest(testId);

        const taskIds = test.tasks || [];
        const studentResultIds = test.student_test_results || [];

        const deleteTestPayload = {
            test: BuildDeletePayload({
                ids: [testId],
                statusKey: 'test_status',
                timestamp: deletionTimestamp,
                userId
            }),
            subject: BuildPullTestFromSubjectPayload({
                subjectId: test.subject,
                testId
            }),
            tasks: null,
            studentTestResults: null
        };

        if (taskIds.length) {
            deleteTestPayload.tasks = HandleDeleteTasks({
                taskIds,
                userId,
                timestamp: deletionTimestamp
            });
        }

        if (studentResultIds.length) {
            deleteTestPayload.studentTestResults = HandleDeleteStudentTestResults({
                resultIds: studentResultIds,
                userId,
                timestamp: deletionTimestamp
            });
        }

        return deleteTestPayload;
    } catch (error) {
        throw new ApolloError(`Failed to build delete test payload: ${error.message}`, 'GET_DELETE_TEST_PAYLOAD_FAILED', {
            error: error.message
        });
    }
}

/**
 * Fetches a single test document by its ID.
 * @param {string} testId - The ID of the test to fetch.
 * @returns {Promise<object>} A promise that resolves to the found test document.
 */
async function GetTest(testId) {
    try {
        const test = await TestModel.findById(testId);
        if (!test) {
            throw new ApolloError('Test not found', 'TEST_NOT_FOUND');
        }
        return test;
    } catch (error) {
        throw new ApolloError(`Failed to get test: ${error.message}`, 'GET_TEST_FAILED', {
            error: error.message
        });
    }
}

/**
 * A generic utility to build a standard soft-delete payload object.
 * @param {object} args - The arguments for building the payload.
 * @param {Array<string>} args.ids - An array of document IDs to target.
 * @param {string} args.statusKey - The name of the status field to be updated.
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
 * Builds a payload for removing a test's ID from a subject's 'tests' array.
 * @param {object} args - The arguments for building the payload.
 * @param {string} args.subjectId - The ID of the subject to update.
 * @param {string} args.testId - The ID of the test to remove.
 * @returns {object} An object containing 'filter' and 'update' properties for a MongoDB $pull operation.
 */
function BuildPullTestFromSubjectPayload({ subjectId, testId }) {
    return {
        filter: { _id: subjectId },
        update: { $pull: { tests: testId } }
    };
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
    CommonValidator.ValidateObjectIdArray(resultIds, 'INVALID_STUDENT_RESULT_ID');

    return BuildDeletePayload({
        ids: resultIds,
        statusKey: 'result_status',
        timestamp,
        userId
    });
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetCreateTestPayload,
    GetUpdateTestPayload,
    GetPublishTestPayload,
    GetAssignCorrectorTaskPayload,
    GetDeleteTestPayload
}