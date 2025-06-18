// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const TestModel = require('./test.model');

/**
 * Creates a new DataLoader for batch-loading active test data by their IDs.
 * This function is used to solve the N+1 problem by collecting individual test ID
 * requests and fetching them in a single database query.
 * @returns {DataLoader} - An instance of DataLoader for fetching tests by their unique ID.
 */
function TestLoader() {
    return new DataLoader(async (testIds) => {
        try {
            const tests = await TestModel.find({
                _id: { $in: testIds },
                test_status: 'ACTIVE',
            });

            const testsById = new Map(tests.map(test => [String(test._id), test]));

            return testIds.map(testId => testsById.get(String(testId)) || null);
        } catch (error) {
            console.error("Error batch fetching tests:", error);
            throw new ApolloError(`Failed to batch fetch tests: ${error.message}`, 'TEST_BATCH_FETCH_FAILED');
        }
    });
}

// *************** EXPORT MODULE ***************
module.exports = TestLoader;