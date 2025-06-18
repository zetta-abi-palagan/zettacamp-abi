// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT HELPER FUNCTION *************** 
const helper = require('./student_test_result.helper');

// *************** IMPORT VALIDATOR ***************
const validator = require('./student_test_result.validator');

// *************** QUERY ***************
/**
 * GraphQL resolver to fetch all student test results, with an optional filter for status.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} [args.student_test_result_status] - Optional. The status to filter results by.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of student test result objects.
 */
async function GetAllStudentTestResults(_, { student_test_result_status }) {
    try {
        validator.ValidateGetAllStudentTestResultsInput(student_test_result_status);

        const studentTestResults = await helper.GetAllStudentTestResultsHelper(student_test_result_status);

        return studentTestResults;
    } catch (error) {
        console.error('Unexpected error in GetAllStudentTestResults:', error);

        throw new ApolloError('Failed to retrieve student test results', 'GET_STUDENT_TEST_RESULTS_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to fetch a single student test result by its unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} args.id - The unique identifier of the student test result to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found student test result object.
 */
async function GetOneStudentTestResult(_, { id }) {
    try {
        validator.ValidateGetOneStudentTestResultInput(id);

        const studentTestResult = await helper.GetOneStudentTestResultHelper(id);

        return studentTestResult;
    } catch (error) {
        console.error('Unexpected error in GetOneStudentTestResult:', error);

        throw new ApolloError('Failed to retrieve student test result', 'GET_STUDENT_TEST_RESULT_FAILED', {
            error: error.message
        });
    }
}

// *************** MUTATION ***************
/**
 * GraphQL resolver to update a student's test result.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the student test result to update.
 * @param {object} args.UpdateStudentTestResult - An input object containing the new marks.
 * @returns {Promise<object>} - A promise that resolves to the updated student test result object.
 */
async function UpdateStudentTestResult(_, { id, UpdateStudentTestResult }) {
    try {
        validator.ValidateInputTypeObject(UpdateStudentTestResult);

        const { marks } = UpdateStudentTestResult;

        validator.ValidateUpdateStudentTestResultInput(id, marks);

        const updatedStudentTestResult = await helper.UpdateStudentTestResultHelper(id, marks);

        return updatedStudentTestResult;
    } catch (error) {
        console.error('Unexpected error in UpdateStudentTestResult:', error);

        throw new ApolloError('Failed to update student test result', 'UPDATE_STUDENT_TEST_RESULT_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************


// *************** EXPORT MODULE ***************
module.exports = {
    Query: {
        GetAllStudentTestResults,
        GetOneStudentTestResult
    },

    Mutation: {
        UpdateStudentTestResult,
        InvalidateStudentTestResult
    },

    StudentTestResult: {
        student: StudentLoader,
        test: TestLoader,
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader,
        deleted_by: DeletedByLoader
    }
}