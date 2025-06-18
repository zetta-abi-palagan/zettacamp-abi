// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const StudentTestResultModel = require('./student_test_result.model');

/**
 * Creates a new DataLoader for batch-loading student test result data by their IDs.
 * This function is used to solve the N+1 problem by collecting individual result ID
 * requests and fetching them in a single database query.
 * @returns {DataLoader} - An instance of DataLoader for fetching student test results by their unique ID.
 */
function StudentTestResultLoader() {
    return new DataLoader(async (studentTestResultIds) => {
        try {
            const results = await StudentTestResultModel.find({
                _id: { $in: studentTestResultIds },
            });

            const resultsById = new Map(results.map(result => [String(result._id), result]));

            return studentTestResultIds.map(id => resultsById.get(String(id)) || null);
        } catch (error) {
            console.error("Error batch fetching student test results:", error);
            throw new ApolloError(`Failed to batch fetch student test results: ${error.message}`, 'STUDENT_TEST_RESULT_BATCH_FETCH_FAILED');
        }
    });
}

// *************** EXPORT MODULE ***************
module.exports = StudentTestResultLoader;