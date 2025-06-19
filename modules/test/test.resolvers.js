// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT HELPER FUNCTION *************** 
const helper = require('./test.helper');

// *************** IMPORT VALIDATOR ***************
const validator = require('./test.validator');

// *************** QUERY ***************
/**
 * GraphQL resolver to fetch all tests, with an optional filter for test status.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} [args.test_status] - Optional. The status to filter tests by (e.g., 'ACTIVE').
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of test objects.
 */
async function GetAllTests(_, { test_status }) {
    try {
        validator.ValidateGetAllTestsInput(test_status);

        const tests = await helper.GetAllTestsHelper(test_status);

        return tests;
    } catch (error) {
        console.error('Unexpected error in GetAllTests:', error);

        throw new ApolloError('Failed to retrieve tests', 'GET_TESTS_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to fetch a single test by its unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} args.id - The unique identifier of the test to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found test object.
 */
async function GetOneTest(_, { id }) {
    try {
        validator.ValidateGetOneTestInput(id);

        const test = await helper.GetOneTestHelper(id);

        return test;
    } catch (error) {
        console.error('Unexpected error in GetOneTest:', error);

        throw new ApolloError('Failed to retrieve test', 'GET_TEST_FAILED', {
            error: error.message
        });
    }
}

// *************** MUTATION ***************
/**
 * GraphQL resolver to create a new test.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {object} args.createTestInput - An object containing the details for the new test.
 * @returns {Promise<object>} - A promise that resolves to the newly created test object.
 */
async function CreateTest(_, { createTestInput }) {
    try {
        validator.ValidateInputTypeObject(createTestInput);

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

        validator.ValidateCreateTestInput(subject, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status);

        const newTest = await helper.CreateTestHelper(subject, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status);

        return newTest;
    } catch (error) {
        console.error('Unexpected error in CreateTest:', error);

        throw new ApolloError('Failed to create test', 'CREATE_TEST_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to publish a test, setting its due dates.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the test to publish.
 * @param {Date} args.assign_corrector_due_date - The deadline for assigning a corrector.
 * @param {Date} args.test_due_date - The deadline for completing the test.
 * @returns {Promise<object>} - A promise that resolves to the published test object.
 */
async function PublishTest(_, { id, assign_corrector_due_date, test_due_date }) {
    try {
        validator.ValidatePublishTestInput(id, assign_corrector_due_date, test_due_date);

        const publishedTest = await helper.PublishTestHelper(id, assign_corrector_due_date, test_due_date);

        return publishedTest;
    } catch (error) {
        console.error('Unexpected error in PublishTest:', error);

        throw new ApolloError('Failed to publish test', 'PUBLISH_TEST_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to update an existing test.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the test to update.
 * @param {object} args.updateTestInput - An object containing the fields to be updated.
 * @returns {Promise<object>} - A promise that resolves to the updated test object.
 */
async function UpdateTest(_, { id, updateTestInput }) {
    try {
        validator.ValidateInputTypeObject(updateTestInput);

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
        } = updateTestInput

        validator.ValidateUpdateTestInput(id, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status)

        const updatedTest = helper.UpdateTestHelper(id, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status)

        return updatedTest;
    } catch (error) {
        console.error('Unexpected error in UpdateTest:', error);

        throw new ApolloError('Failed to update test', 'UPDATE_TEST_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to delete a test by its ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the test to delete.
 * @returns {Promise<object>} - A promise that resolves to the deleted test object.
 */
async function DeleteTest(_, { id }) {
    try {
        validator.ValidateDeleteTestInput(id);

        const deletedTest = await helper.DeleteTestHelper(id);

        return deletedTest;
    } catch (error) {
        console.error('Unexpected error in DeleteTest:', error);

        throw new ApolloError('Failed to delete test', 'DELETE_TEST_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************
/**
 * Loads the parent subject for a test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {string} test.subject - The ID of the subject to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the subject object.
 */
async function SubjectLoader(test, _, context) {
    try {
        validator.ValidateSubjectLoaderInput(test, context);

        const subject = await context.dataLoaders.SubjectLoader.load(test.subject);

        return subject;
    } catch (error) {
        throw new ApolloError(`Failed to fetch subject`, 'SUBJECT_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the student test results associated with a test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {Array<string>} test.student_test_results - An array of student test result IDs to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of student test result objects.
 */
async function StudentTestResultLoader(test, _, context) {
    try {
        validator.ValidateStudentTestResultLoaderInput(test, context);

        const student_test_results = await context.dataLoaders.StudentTestResultLoader.loadMany(test.student_test_results);

        return student_test_results;
    } catch (error) {
        throw new ApolloError(`Failed to fetch student test results`, 'STUDENT_TEST_RESULTS_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the tasks associated with a test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {Array<string>} test.tasks - An array of task IDs to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of task objects.
 */
async function TaskLoader(test, _, context) {
    try {
        validator.ValidateTaskLoaderInput(test, context);

        const tasks = await context.dataLoaders.TaskLoader.loadMany(test.tasks);

        return tasks;
    } catch (error) {
        throw new ApolloError(`Failed to fetch tasks`, 'TASKS_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who created the test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {string} test.created_by - The ID of the user who created the test.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(test, _, context) {
    try {
        validator.ValidateUserLoaderInput(test, context, 'created_by');

        const created_by = await context.dataLoaders.UserLoader.load(test.created_by);

        return created_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who last updated the test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {string} test.updated_by - The ID of the user who last updated the test.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(test, _, context) {
    try {
        validator.ValidateUserLoaderInput(test, context, 'updated_by');

        const updated_by = await context.dataLoaders.UserLoader.load(test.updated_by);

        return updated_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who published the test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {string} test.published_by - The ID of the user who published the test.
 * @param {object} _ - The arguments object, not used in this resolver.
 *- @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function PublishedByLoader(test, _, context) {
    try {
        validator.ValidateUserLoaderInput(test, context, 'published_by');

        const updated_by = await context.dataLoaders.UserLoader.load(test.published_by);

        return updated_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who deleted the test using a DataLoader.
 * @param {object} test - The parent test object.
 * @param {string} test.updated_by - The ID of the user who performed the deletion.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function DeletedByLoader(test, _, context) {
    try {
        validator.ValidateUserLoaderInput(test, context, 'deleted_by');

        const deleted_by = await context.dataLoaders.UserLoader.load(test.updated_by);

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
        GetAllTests,
        GetOneTest
    },

    Mutation: {
        CreateTest,
        PublishTest,
        UpdateTest,
        DeleteTest
    },

    Test: {
        subject: SubjectLoader,
        student_test_results: StudentTestResultLoader,
        tasks: TaskLoader,
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader,
        published_by: PublishedByLoader,
        deleted_by: DeletedByLoader
    }
}