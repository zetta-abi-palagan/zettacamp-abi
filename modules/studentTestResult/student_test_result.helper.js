// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const StudentTestResultModel = require('./student_test_result.model');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../../shared/validator/index');
const StudentTestResultValidator = require('./student_test_result.validator');

/**
 * Creates a clean data payload for updating a student's test result.
 * @param {object} args - The arguments for creating the payload.
 * @param {Array<object>} args.marks - An array of mark objects, each containing a 'mark' property.
 * @param {string} args.userId - The ID of the user updating the result.
 * @param {object} args.test - The parent test document, used for validation.
 * @returns {object} A processed data payload including the calculated average mark.
 */
function GetUpdateStudentTestResultPayload({ marks, userId, test }) {
    CommonValidator.ValidateInputTypeObject(marks);
    CommonValidator.ValidateObjectId(userId);
    StudentTestResultValidator.ValidateUpdateStudentTestResultInput({ marks, test });

    let totalMarks = 0;
    for (const item of marks) {
        totalMarks += item.mark;
    }
    const averageMark = totalMarks / marks.length;

    return {
        marks: marks,
        average_mark: averageMark,
        updated_by: userId
    };
}

/**
 * Generates a payload for soft-deleting a student test result and removing its reference from the parent test.
 * @param {object} args - The arguments for getting the delete payload.
 * @param {string} args.studentTestResultId - The unique identifier of the student test result to be deleted.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for the delete and update operations.
 */
async function GetDeleteStudentTestResultPayload({ studentTestResultId, userId }) {
    CommonValidator.ValidateObjectId(studentTestResultId);
    CommonValidator.ValidateObjectId(userId);

    const deletionTimestamp = Date.now();
    const studentTestResult = await GetStudentTestResult(studentTestResultId);
    const testId = studentTestResult.test;

    const deletePayload = {
        studentTestResult: BuildDeletePayload({
            ids: [studentTestResultId],
            statusKey: 'student_test_result_status',
            timestamp: deletionTimestamp,
            userId
        }),
        test: BuildPullResultFromTestPayload(testId, studentTestResultId)
    };

    return deletePayload;
}

/**
 * Fetches a single student test result document by its ID.
 * @param {string} studentTestResultId - The ID of the student test result to fetch.
 * @returns {Promise<object>} A promise that resolves to the found student test result document.
 */
async function GetStudentTestResult(studentTestResultId) {
    const studentTestResult = await StudentTestResultModel.findById(studentTestResultId);
    if (!studentTestResult) {
        throw new ApolloError('Student test result not found', 'STUDENT_TEST_RESULT_NOT_FOUND');
    }

    return studentTestResult;
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
 * Builds a payload for removing a student test result ID from a test's 'student_test_results' array.
 * @param {object} args - The arguments for building the payload.
 * @param {string} args.testId - The ID of the test to update.
 * @param {string} args.studentTestResultId - The ID of the student test result to remove.
 * @returns {object} An object containing 'filter' and 'update' properties for a MongoDB $pull operation.
 */
function BuildPullResultFromTestPayload({ testId, studentTestResultId }) {
    return {
        filter: { _id: testId },
        update: { $pull: { student_test_results: studentTestResultId } }
    };
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetUpdateStudentTestResultPayload,
    GetDeleteStudentTestResultPayload
}