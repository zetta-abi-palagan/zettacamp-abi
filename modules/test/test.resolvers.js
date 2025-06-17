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