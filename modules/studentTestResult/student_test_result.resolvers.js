// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT HELPER FUNCTION *************** 
const helper = require('./student_test_result.helper');

// *************** IMPORT VALIDATOR ***************
const validator = require('./student_test_result.validator');

// *************** QUERY ***************
/**
 * GraphQL resolver to fetch all student test results, with optional filters.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} [args.student_test_result_status] - Optional. The status to filter results by.
 * @param {string} [args.test_id] - Optional. The ID of the test to filter results by.
 * @param {string} [args.student_id] - Optional. The ID of the student to filter results by.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of student test result objects.
 */

async function GetAllStudentTestResults(_, { student_test_result_status, test_id, student_id }) {
    try {
        validator.ValidateGetAllStudentTestResultsInput(student_test_result_status, test_id, student_id);

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
async function UpdateStudentTestResult(_, { id, updateStudentTestResultInput }) {
    try {
        validator.ValidateInputTypeObject(updateStudentTestResultInput);

        const { marks } = updateStudentTestResultInput;

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

/**
 * GraphQL resolver to invalidate a student's test result.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the student test result to invalidate.
 * @returns {Promise<object>} - A promise that resolves to the invalidated student test result object.
 */
async function InvalidateStudentTestResult(_, { id }) {
    try {
        validator.ValidateInvalidateStudentTestResultInput(id);

        const invalidatedStudentTestResult = await helper.InvalidateStudentTestResultHelper(id)

        return invalidatedStudentTestResult;
    } catch (error) {
        console.error('Unexpected error in InvalidateStudentTestResult:', error);

        throw new ApolloError('Failed to invalidate student test result', 'INVALIDATE_STUDENT_TEST_RESULT_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************
/**
 * Loads the student associated with a test result using a DataLoader.
 * @param {object} studentTestResult - The parent student test result object.
 * @param {string} studentTestResult.student - The ID of the student to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the student object.
 */
async function StudentLoader(studentTestResult, _, context) {
    try {
        validator.ValidateStudentLoaderInput(studentTestResult, context);

        const student = await context.dataLoaders.StudentLoader.load(studentTestResult.student);

        return student;
    } catch (error) {
        throw new ApolloError(`Failed to fetch student`, 'STUDENT_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the test associated with a student's result using a DataLoader.
 * @param {object} studentTestResult - The parent student test result object.
 * @param {string} studentTestResult.test - The ID of the test to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the test object.
 */
async function TestLoader(studentTestResult, _, context) {
    try {
        validator.ValidateTestLoaderInput(studentTestResult, context);

        const test = await context.dataLoaders.StudentLoader.load(studentTestResult.test);

        return test;
    } catch (error) {
        throw new ApolloError(`Failed to fetch test`, 'TEST_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who created the studentTestResult using a DataLoader.
 * @param {object} studentTestResult - The parent studentTestResult object.
 * @param {string} studentTestResult.created_by - The ID of the user who created the studentTestResult.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(studentTestResult, _, context) {
    try {
        validator.ValidateUserLoaderInput(studentTestResult, context, 'created_by');

        const created_by = await context.dataLoaders.UserLoader.load(studentTestResult.created_by);

        return created_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who last updated the studentTestResult using a DataLoader.
 * @param {object} studentTestResult - The parent studentTestResult object.
 * @param {string} studentTestResult.updated_by - The ID of the user who last updated the studentTestResult.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(studentTestResult, _, context) {
    try {
        validator.ValidateUserLoaderInput(studentTestResult, context, 'updated_by');

        const updated_by = await context.dataLoaders.UserLoader.load(studentTestResult.updated_by);

        return updated_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who deleted the studentTestResult using a DataLoader.
 * @param {object} studentTestResult - The parent studentTestResult object.
 * @param {string} studentTestResult.updated_by - The ID of the user who performed the deletion.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function DeletedByLoader(studentTestResult, _, context) {
    try {
        validator.ValidateUserLoaderInput(studentTestResult, context, 'deleted_by');

        const deleted_by = await context.dataLoaders.UserLoader.load(studentTestResult.updated_by);

        return deleted_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

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