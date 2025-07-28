// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const TestModel = require('./test.model');

// *************** IMPORT UTILITES ***************
const CommonHelper = require('../../shared/helper/index');

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
    test_status,
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
    updated_by: userId,
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
function GetUpdateTestPayload({ testInput, userId, evaluationType, existingNotations }) {
  CommonValidator.ValidateInputTypeObject(testInput);
  CommonValidator.ValidateObjectId(userId);
  TestValidator.ValidateTestInput({ testInput, evaluationType, existingNotations, isUpdate: true });

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
    test_status,
    test_passing_criteria,
  } = testInput;

  let payload = {};

  if (name !== undefined && name !== null) payload.name = name;
  if (description !== undefined && description !== null) payload.description = description;
  if (test_type !== undefined && test_type !== null) payload.test_type = test_type.toUpperCase();
  if (result_visibility !== undefined && result_visibility !== null) payload.result_visibility = result_visibility.toUpperCase();
  if (weight !== undefined && weight !== null) payload.weight = weight;
  if (correction_type !== undefined && correction_type !== null) payload.correction_type = correction_type.toUpperCase();
  if (notations !== undefined && notations !== null) payload.notations = notations;
  if (is_retake !== undefined && is_retake !== null) payload.is_retake = is_retake;
  if (connected_test !== undefined && connected_test !== null) payload.connected_test = connected_test;
  if (test_status !== undefined && test_status !== null) payload.test_status = test_status.toUpperCase();
  if (test_passing_criteria !== undefined && test_passing_criteria !== null) payload.test_passing_criteria = test_passing_criteria;

  payload.updated_by = userId;

  return payload;
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
  CommonValidator.ValidateObjectId(testId);
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
    updated_by: userId,
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

    const test = await TestModel.findOne({ _id: testId, test_status: { $ne: 'DELETED' } });
    if (!test) {
      throw new ApolloError('Test not found', 'TEST_NOT_FOUND');
    }

    const taskIds = test.tasks || [];
    const studentResultIds = test.student_test_results || [];

    const deleteTestPayload = {
      test: CommonHelper.BuildDeletePayload({
        ids: [testId],
        statusKey: 'test_status',
        timestamp: deletionTimestamp,
        userId,
      }),
      subject: BuildPullTestFromSubjectPayload({
        subjectId: test.subject,
        testId,
      }),
      tasks: null,
      studentTestResults: null,
    };

    if (taskIds.length) {
      deleteTestPayload.tasks = CommonHelper.HandleDeleteTasks({
        taskIds,
        userId,
        timestamp: deletionTimestamp,
      });
    }

    if (studentResultIds.length) {
      deleteTestPayload.studentTestResults = CommonHelper.HandleDeleteStudentTestResults({
        resultIds: studentResultIds,
        userId,
        timestamp: deletionTimestamp,
      });
    }

    return deleteTestPayload;
  } catch (error) {
    throw new ApolloError(`Failed to build delete test payload: ${error.message}`, 'GET_DELETE_TEST_PAYLOAD_FAILED', {
      error: error.message,
    });
  }
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
    update: { $pull: { tests: testId } },
  };
}

// *************** EXPORT MODULE ***************
module.exports = {
  GetCreateTestPayload,
  GetUpdateTestPayload,
  GetPublishTestPayload,
  GetAssignCorrectorTaskPayload,
  GetDeleteTestPayload,
};
