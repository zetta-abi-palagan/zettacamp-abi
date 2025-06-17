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

        const newTest = await helper.CreateTestHelper(validatedInput);

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

// *************** LOADER ***************


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

    Subject: {
        published_by: PublishedByLoader,
        student_test_results: StudentTestResultLoader,
        tasks: TaskLoader,
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader,
        deleted_by: DeletedByLoader
    }
}