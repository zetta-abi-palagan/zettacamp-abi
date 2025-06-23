// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const StudentTestResultModel = require('./student_test_result.model');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../../shared/validator/index');

/**
 * Creates a clean data payload for updating a student's test result.
 * @param {Array<object>} marks - An array of mark objects, each containing a 'mark' property.
 * @param {string} userId - The ID of the user updating the result.
 * @returns {object} A processed data payload including the calculated average mark.
 */
function GetUpdateStudentTestResultPayload(marks, userId) {
    CommonValidator.ValidateInputTypeObject({ marks: marks }); // Basic type check

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
 * @param {string} resultId - The unique identifier of the student test result to be deleted.
 * @param {string} userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for the delete and update operations.
 */
async function GetDeleteStudentTestResultPayload(resultId, userId) {
    CommonValidator.ValidateObjectId(resultId);

    const deletionTimestamp = Date.now();

    const studentTestResult = await StudentTestResultModel.findById(resultId);
    if (!studentTestResult) {
        throw new ApolloError('Student test result not found', 'STUDENT_TEST_RESULT_NOT_FOUND');
    }

    const testId = studentTestResult.test;
    if (!mongoose.Types.ObjectId.isValid(testId)) {
        throw new ApolloError('Invalid test ID in student test result', 'INVALID_TEST_ID');
    }

    const deleteStudentTestResultPayload = {
        studentTestResult: {
            filter: { _id: resultId },
            update: {
                result_status: 'DELETED',
                updated_by: userId,
                deleted_by: userId,
                deleted_at: deletionTimestamp
            }
        },
        test: {
            filter: { _id: testId },
            update: { $pull: { student_test_results: resultId } }
        }
    };

    return deleteStudentTestResultPayload;
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetUpdateStudentTestResultPayload,
    GetDeleteStudentTestResultPayload
}