// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const StudentTestResultModel = require('./student_test_result.model');

// *************** IMPORT UTILITES ***************
const CommonHelper = require('../../shared/helper/index')

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
function GetUpdateStudentTestResultPayload({ marks, userId, notations }) {
    CommonValidator.ValidateInputTypeObject(marks);
    CommonValidator.ValidateObjectId(userId);
    StudentTestResultValidator.ValidateUpdateStudentTestResultInput({ marks, notations });

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
    try {
        CommonValidator.ValidateObjectId(studentTestResultId);
        CommonValidator.ValidateObjectId(userId);

        const deletionTimestamp = Date.now();

        const studentTestResult = await StudentTestResultModel.findOne({ _id: studentTestResultId, student_test_result_status: { $ne: 'DELETED' } });
        if (!studentTestResult) {
            throw new ApolloError('Student test result not found', 'STUDENT_TEST_RESULT_NOT_FOUND');
        }

        const testId = studentTestResult.test;

        const deletePayload = {
            studentTestResult: CommonHelper.BuildDeletePayload({
                ids: [studentTestResultId],
                statusKey: 'student_test_result_status',
                timestamp: deletionTimestamp,
                userId
            }),
            test: BuildPullResultFromTestPayload(testId, studentTestResultId)
        };

        return deletePayload;
    } catch (error) {
        throw new ApolloError(`Failed to build delete student test result payload: ${error.message}`, 'GET_DELETE_STUDENT_TEST_RESULT_PAYLOAD_FAILED', {
            error: error.message
        });
    }
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