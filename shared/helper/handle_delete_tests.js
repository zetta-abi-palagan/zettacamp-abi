// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const TestModel = require('../../modules/test/test.model');

// *************** IMPORT UTILITES ***************
const BuildDeletePayload = require('./build_delete_payload');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../validator/index');

/**
 * Handles the processing of test IDs for deletion, creating a payload and collecting descendant task and result IDs.
 * @param {object} args - The arguments for handling test deletion.
 * @param {Array<string>} args.testIds - An array of test IDs to process.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @returns {Promise<object>} A promise that resolves to an object containing the test delete payload, an array of task IDs, and an array of student result IDs.
 */
async function HandleDeleteTests({ testIds, userId, timestamp }) {
    try {
        CommonValidator.ValidateObjectIdArray(testIds, 'INVALID_TEST_ID');

        const tests = await TestModel.find({ _id: { $in: testIds } });

        if (!tests.length) {
            throw new ApolloError('No matching tests found', 'TESTS_NOT_FOUND');
        }

        const taskIds = [].concat(...tests.map(test => test.tasks || []));
        const studentResultIds = [].concat(...tests.map(test => test.student_test_results || []));

        const testPayload = BuildDeletePayload({
            ids: testIds,
            statusKey: 'test_status',
            timestamp,
            userId
        });

        return { testPayload, taskIds, studentResultIds };
    } catch (error) {
        throw new ApolloError(`Failed to handle delete tests: ${error.message}`, 'HANDLE_DELETE_TESTS_FAILED', {
            error: error.message,
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = HandleDeleteTests;