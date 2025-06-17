// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT HELPER FUNCTION *************** 
const helper = require('./test.helper');

// *************** IMPORT VALIDATOR ***************
const validator = require('./test.validator');


// *************** QUERY ***************


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

        await validator.ValidateCreateTestInput(subject, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status);

        const newTest = await helper.CreateTestHelper(validatedInput);

        return newTest;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in CreateTest:', error);

        throw new ApolloError('Failed to create test', 'CREATE_TEST_FAILED');
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