// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** EXPORT MODULE ***************
module.exports = gql`
    enum ResultStatus {
        PASS
        FAIL
    }

    type FinalTranscriptResult {
        _id: ID!
        student: Student!
        overall_result: ResultStatus!
        block_results: [BlockResult!]!
        created_by: User!
        updated_by: User!
        created_at: String!
        updated_at: String!
    }

    type BlockResult {
        block: Block!
        block_result: ResultStatus!
        block_total_mark: Float!
        subject_results: [SubjectResult!]!
    }

    type SubjectResult {
        subject: Subject!
        subject_result: ResultStatus!
        subject_total_mark: Float!
        test_results: [TestResult!]!
    }

    type TestResult {
        test: Test!
        test_result: ResultStatus!
        test_total_mark: Float!
        test_weighted_mark: Float!
    }

    type Query {
        GetFinalTranscriptResult(studentId: ID): FinalTranscriptResult
    }
`