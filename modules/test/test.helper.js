// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const TestModel = require('./test.model');
const SubjectModel = require('../subject/subject.model');
const BlockModel = require('../block/block.model');
const TaskModel = require('../task/task.model');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../../shared/validator/index');

/**
 * Creates a clean data payload for a new test.
 * @param {object} createTestInput - The raw input object containing the test's properties.
 * @param {string} userId - The ID of the user creating the test.
 * @returns {object} A processed data payload suitable for a create operation.
 */
function GetCreateTestPayload(createTestInput, userId) {
    CommonValidator.ValidateInputTypeObject(createTestInput);
    CommonValidator.ValidateObjectId(userId);

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
    } = createTestInput;

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
 * Creates a clean data payload for updating an existing test.
 * @param {object} testInput - The raw input object containing the test's properties to update.
 * @param {string} userId - The ID of the user updating the test.
 * @returns {object} A processed data payload suitable for an update operation.
 */
function GetUpdateTestPayload(testInput, userId) {
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
        test_type: test_type.toUpperCase(),
        result_visibility: result_visibility.toUpperCase(),
        weight,
        correction_type: correction_type.toUpperCase(),
        notations,
        is_retake,
        connected_test,
        test_status: test_status.toUpperCase(),
        updated_by: userId
    };
}

/**
 * Creates the payload for publishing a test.
 * @param {string} userId - The ID of the user publishing the test.
 * @param {Date|string} test_due_date - The due date for the test.
 * @returns {object} A data payload for updating the test's published status.
 */
function GetPublishTestPayload(userId, test_due_date) {
    return {
        is_published: true,
        published_date: Date.now(),
        published_by: userId,
        test_due_date: test_due_date,
    };
}

/**
 * Creates the payload for a new 'ASSIGN_CORRECTOR' task.
 * @param {object} publishedTest - The test document that was just published.
 * @param {Date|string} assign_corrector_due_date - The due date for the new task.
 * @param {string} userId - The ID of the user who initiated the publish action.
 * @returns {object} A data payload for creating the new task.
 */
function GetAssignCorrectorTaskPayload(publishedTest, assign_corrector_due_date, userId) {
    CommonValidator.ValidateInputTypeObject(test);
    // Dummy ID for academic director, should eventually come from a config or role-based lookup
    const academicDirectorId = '6846e5769e5502fce150eb67';

    return {
        test: publishedTest.id,
        user: academicDirectorId,
        title: 'Assign Corrector',
        description: 'Academic Director should assign corrector for student test',
        task_type: 'ASSIGN_CORRECTOR',
        task_status: 'PENDING',
        due_date: assign_corrector_due_date,
        created_by: userId,
        updated_by: userId
    };
}

/**
 * Generates a payload for a cascading soft delete of a test and its descendants.
 * @param {string} testId - The unique identifier of the test to be deleted.
 * @param {string} userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for all required delete and update operations.
 */
async function GetDeleteTestPayload(testId, userId) {
    GlobalValidator.ValidateObjectId(testId);

    const deletionTimestamp = Date.now();

    const test = await TestModel.findById(testId);
    if (!test) {
        throw new ApolloError('Test not found', 'TEST_NOT_FOUND');
    }

    const deleteTestPayload = {
        test: {
            filter: { _id: testId },
            update: {
                test_status: 'DELETED',
                updated_by: userId,
                deleted_by: userId,
                deleted_at: deletionTimestamp
            }
        },
        subject: {
            filter: { tests: { $in: [testId] } },
            update: { $pull: { tests: testId } }
        },
        tasks: null,
        studentTestResults: null
    };

    const taskIds = test.tasks || [];
    const studentResultIds = test.student_test_results || [];

    if (taskIds.length) {
        const areAllTaskIdsValid = taskIds.every(id => mongoose.Types.ObjectId.isValid(id));
        if (!areAllTaskIdsValid) {
            throw new ApolloError('One or more task IDs are invalid', 'INVALID_TASK_ID');
        }

        deleteTestPayload.tasks = {
            filter: { _id: { $in: taskIds } },
            update: {
                task_status: 'DELETED',
                updated_by: userId,
                deleted_by: userId,
                deleted_at: deletionTimestamp
            }
        };
    }

    if (studentResultIds.length) {
        const areAllResultIdsValid = studentResultIds.every(id => mongoose.Types.ObjectId.isValid(id));
        if (!areAllResultIdsValid) {
            throw new ApolloError('One or more student test result IDs are invalid', 'INVALID_STUDENT_RESULT_ID');
        }

        deleteTestPayload.studentTestResults = {
            filter: { _id: { $in: studentResultIds } },
            update: {
                result_status: 'DELETED',
                updated_by: userId,
                deleted_by: userId,
                deleted_at: deletionTimestamp
            }
        };
    }

    return deleteTestPayload;
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetCreateTestPayload,
    GetUpdateTestPayload,
    GetPublishTestPayload,
    GetAssignCorrectorTaskPayload,
    GetDeleteTestPayload
}