// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const TestModel = require('../test/test.model');
const StudentTestResultModel = require('./student_test_result.model');

// *************** IMPORT HELPER FUNCTION *************** 
const StudentTestResultHelper = require('./student_test_result.helper');

// *************** IMPORT VALIDATOR ***************
const StudentTestResultValidator = require('./student_test_result.validator');
const CommonValidator = require('../../shared/validator/index');

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
        StudentTestResultValidator.ValidateStudentTestResultFilter({ studentTestResult: student_test_result_status, testId: test_id, studentId: student_id });

        const filter = {};
        filter.student_test_result_status = student_test_result_status || { $ne: 'DELETED' };
        if (test_id) { filter.test = test_id; }
        if (student_id) { filter.student = student_id; }

        const studentTestResults = await StudentTestResultModel.find(filter).lean();

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
        CommonValidator.ValidateObjectId(id);

        const studentTestResult = await StudentTestResultModel.findOne({ _id: id }).lean();
        if (!studentTestResult) {
            throw new ApolloError('Student test result not found', 'STUDENT_TEST_RESULT_NOT_FOUND');
        }

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
 * GraphQL resolver to update an existing student's test result.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the student test result to update.
 * @param {object} args.updateStudentTestResultInput - An object containing the new marks data.
 * @returns {Promise<object>} - A promise that resolves to the updated student test result object.
 */
async function UpdateStudentTestResult(_, { id, updateStudentTestResultInput }) {
    try {
        // *************** Dummy user ID (replace with real one later)
        const userId = '6846e5769e5502fce150eb67';

        CommonValidator.ValidateObjectId(id);
        CommonValidator.ValidateInputTypeObject(updateStudentTestResultInput);

        const marks = updateStudentTestResultInput.marks;

        // *************** Check the to be updated student test result
        const studentTestResult = await StudentTestResultModel.findOne({ _id: id, student_test_result_status: { $ne: 'DELETED' } }).lean();
        if (!studentTestResult) {
            throw new ApolloError('Student test result not found', 'STUDENT_TEST_RESULT_NOT_FOUND');
        }

        // *************** Check the parent test of the student test result
        const parentTest = await TestModel.findOne({ _id: studentTestResult.test }).lean();
        if (!parentTest) {
            throw new ApolloError('Related test for this result could not be found.', 'NOT_FOUND');
        }

        StudentTestResultValidator.ValidateUpdateStudentTestResultInput({ marks, test: parentTest });

        // *************** Prepare the payload for updating the student test result
        const updateStudentTestResultPayload = StudentTestResultHelper.GetUpdateStudentTestResultPayload({ marks, userId, test: parentTest });

        // *************** Update the student test result
        const updatedStudentTestResult = await StudentTestResultModel.findOneAndUpdate({ _id: id }, updateStudentTestResultPayload, { new: true }).lean();
        if (!updatedStudentTestResult) {
            throw new ApolloError('Failed to update student test result', 'STUDENT_TEST_RESULT_UPDATE_FAILED');
        }

        return updatedStudentTestResult;
    } catch (error) {
        console.error('Unexpected error in UpdateStudentTestResult:', error);

        throw new ApolloError('Failed to update student test result', 'UPDATE_STUDENT_TEST_RESULT_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to soft-delete a student test result and remove its reference from the parent test.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the student test result to delete.
 * @returns {Promise<object>} - A promise that resolves to the soft-deleted student test result object.
 */
async function DeleteStudentTestResult(_, { id }) {
    try {
        // *************** Dummy user ID (replace with real one later)
        const userId = '6846e5769e5502fce150eb67';

        CommonValidator.ValidateObjectId(id);

        // *************** Prepare the payload for deleting the student test result
        const {
            studentTestResult,
            test
        } = await StudentTestResultHelper.GetDeleteStudentTestResultPayload({ studentTestResultId: id, userId });

        // *************** Soft-delete the student test result and update the parent test
        const deletedStudentTestResult = await StudentTestResultModel.findOneAndUpdate(
            studentTestResult.filter,
            studentTestResult.update,
        ).lean();

        if (!deletedStudentTestResult) {
            throw new ApolloError('Failed to delete student test result', 'STUDENT_TEST_RESULT_DELETION_FAILED');
        }

        const updatedTest = await TestModel.updateOne(test.filter, test.update);
        if (!updatedTest.nModified) {
            throw new ApolloError('Failed to update test', 'TEST_UPDATE_FAILED');
        }

        return deletedStudentTestResult;
    } catch (error) {
        console.error('Unexpected error in DeleteStudentTestResult:', error);

        throw new ApolloError('Failed to delete student test result', 'DELETE_STUDENT_TEST_RESULT_FAILED', {
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
        StudentTestResultValidator.ValidateStudentLoaderInput(studentTestResult, context);

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
        StudentTestResultValidator.ValidateTestLoaderInput(studentTestResult, context);

        const test = await context.dataLoaders.TestLoader.load(studentTestResult.test);

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
        StudentTestResultValidator.ValidateUserLoaderInput(studentTestResult, context, 'created_by');

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
        StudentTestResultValidator.ValidateUserLoaderInput(studentTestResult, context, 'updated_by');

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
        StudentTestResultValidator.ValidateUserLoaderInput(studentTestResult, context, 'deleted_by');

        const deleted_by = await context.dataLoaders.UserLoader.load(studentTestResult.deleted_by);

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
        DeleteStudentTestResult
    },

    StudentTestResult: {
        student: StudentLoader,
        test: TestLoader,
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader,
        deleted_by: DeletedByLoader
    }
}