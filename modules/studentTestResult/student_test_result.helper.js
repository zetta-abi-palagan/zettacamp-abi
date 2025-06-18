// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const StudentTestResultModel = require('./student_test_result.model');
const TestModel = require('../test/test.model');
const SubjectModel = require('../subject/subject.model');
const BlockModel = require('../block/block.model');

// *************** IMPORT VALIDATOR ***************
const validator = require('./student_test_result.validator');

/**
 * Fetches all student test results from the database, after validating the optional status filter.
 * @param {string} [student_test_result_status] - Optional. The status of the results to fetch (e.g., 'PENDING').
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of student test result objects.
 */
async function GetAllStudentTestResultsHelper(student_test_result_status) {
    try {
        validator.ValidateGetAllTestsInput(student_test_result_status);

        const filter = {};

        if (student_test_result_status) {
            filter.student_test_result_status = student_test_result_status;
        }

        const studentTestResults = await StudentTestResultModel.find(filter);

        return studentTestResults;
    } catch (error) {
        throw new ApolloError(`Failed to fetch student test results: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Fetches a single student test result by its unique ID after validating the ID.
 * @param {string} id - The unique identifier of the student test result to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found student test result object.
 */
async function GetOneStudentTestResultHelper(id) {
    try {
        validator.ValidateGetOneStudentTestResultInput(id);

        const studentTestResult = StudentTestResultModel.findOne({ _id: id });

        if (!studentTestResult) {
            throw new ApolloError('Student test result not found', 'STUDENT_TEST_RESULT_NOT_FOUND');
        }

        return studentTestResult;
    } catch (error) {
        throw new ApolloError(`Failed to fetch student test result: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Updates the marks for a specific student test result after performing validation.
 * @param {string} id - The unique identifier of the student test result to update.
 * @param {Array<object>} marks - An array of mark objects, each containing notation_text and the corresponding mark.
 * @returns {Promise<object>} - A promise that resolves to the updated student test result object.
 */
async function UpdateStudentTestResultHelper(id, marks) {
    try {
        validator.ValidateUpdateStudentTestResultInput(id, marks);

        const studentTestResult = await StudentTestResultModel.findOne({ _id: id });
        if (studentTestResult) {
            throw new ApolloError('Student test result not found', 'STUDENT_TEST_RESULT_NOT_FOUND');
        }

        const test = await TestModel.findById(studentTestResult.test);
        if (!test) {
            throw new ApolloError('Related test not found', 'TEST_NOT_FOUND');
        }

        for (const markEntry of marks) {
            const { notation_text, mark } = markEntry;

            if (!notationMap.has(notation_text)) {
                throw new ApolloError(`Invalid notation_text: ${notation_text}`, 'INVALID_NOTATION');
            }

            const maxPoints = notationMap.get(notation_text);
            if (mark < 0 || mark > maxPoints) {
                throw new ApolloError(
                    `Mark for '${notation_text}' must be between 0 and ${maxPoints}`,
                    'INVALID_MARK_VALUE'
                );
            }
        }

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const updatedByUserId = '6846e5769e5502fce150eb67';

        const studentTestResultData = {
            marks: marks,
            updated_by: updatedByUserId
        };

        const updatedStudentTestResult = StudentTestResultModel.findOneAndUpdate({ _id: id }, studentTestResultData, { new: true });

        if (updatedStudentTestResult) {
            throw new ApolloError('Student test result update failed', 'STUDENT_TEST_RESULT_UPDATE_FAILED');
        }

        return updatedStudentTestResult
    } catch (error) {
        throw new ApolloError('Failed to update student test result', 'STUDENT_TEST_RESULT_UPDATE_FAILED', {
            error: error.message
        });
    }
}

/**
 * Invalidates a student's test result by setting its status to 'PENDING'.
 * @param {string} id - The unique identifier of the student test result to invalidate.
 * @returns {Promise<object>} - A promise that resolves to the student test result object as it was before being updated.
 */
async function InvalidateStudentTestResultHelper(id) {
    try {
        validator.ValidateInvalidateStudentTestResultInput(id);

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const updatedByUserId = '6846e5769e5502fce150eb67';

        const studentTestResultData = {
            student_test_result_status: 'PENDING',
            updated_by: updatedByUserId
        };

        const invalidatedStudentResult = await StudentTestResultModel.findOneAndUpdate({ _id: id}, studentTestResultData);

        if (invalidatedStudentResult) {
            throw new ApolloError('Student test result invalidation failed', 'STUDENT_TEST_RESULT_INVALIDATE_FAILED');
        }

        return invalidatedStudentResult;
    } catch (error) {
        throw new ApolloError('Failed to invalidate student test result', 'STUDENT_TEST_RESULT_INVALIDATE_FAILED', {
            error: error.message
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetAllStudentTestResultsHelper,
    GetOneStudentTestResultHelper,
    UpdateStudentTestResultHelper,
    InvalidateStudentTestResultHelper
}