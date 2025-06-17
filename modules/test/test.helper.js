// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const TestModel = require('./test.model');
const SubjectModel = require('../subject/subject.model');

// *************** IMPORT VALIDATOR ***************
const validator = require('./test.validator');

/**
 * Creates a new test after validating the input, and updates the parent subject.
 * @param {string} subject - The ID of the subject to which the test will be added.
 * @param {string} name - The name of the test.
 * @param {string} description - The description of the test.
 * @param {string} test_type - The type of the test (e.g., 'QUIZ', 'EXAM').
 * @param {string} result_visibility - The visibility setting for the test results.
 * @param {number} weight - The weight or coefficient of the test.
 * @param {string} correction_type - The correction method for the test.
 * @param {Array<object>} notations - The notation system used for the test.
 * @param {boolean} is_retake - Flag indicating if this is a retake test.
 * @param {string} connected_test - The ID of the original test if this is a retake.
 * @param {string} test_status - The initial status of the test (e.g., 'ACTIVE').
 * @returns {Promise<object>} - A promise that resolves to the newly created test object.
 */
async function CreateTestHelper(subject, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status) {
    try {
        await validator.ValidateCreateTestInput(subject, name, description, test_type, result_visibility, weight, correction_type, notations, is_retake, connected_test, test_status)
        
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const createdByUserId = '6846e5769e5502fce150eb67';

        const testData = {
            subject: subject,
            name: name,
            description: description,
            test_type: test_type,
            result_visibility: result_visibility,
            weight: weight,
            correction_type: correction_type,
            notations: notations,
            is_retake: is_retake,
            connected_test: connected_test,
            test_status: test_status,
            created_by: createdByUserId,
            updated_by: createdByUserId
        }

        const newTest = await TestModel.create(testData);

        await SubjectModel.updateOne(
            { _id: subject, subject_status: 'ACTIVE' },
            {
                $addToSet: { tests: newTest._id },
                $set: { updated_by: createdByUserId }
            }
        );

        return newTest;
    } catch (error) {
        throw new ApolloError('Failed to create test', 'TEST_CREATION_FAILED', {
            error: error.message
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetAllTestsHelper,
    GetOneTestHelper,
    CreateTestHelper,
    PublishTestHelper,
    UpdateTestHelper,
    DeleteTestHelper
}