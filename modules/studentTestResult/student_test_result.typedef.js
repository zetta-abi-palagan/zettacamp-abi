// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** EXPORT MODULE ***************
module.exports = gql`
    enum StudentTestResultStatus {
        PENDING
        VALIDATED
    }

    input MarkInput {
        notation_text: String!
        mark: Float!
    }

    input UpdateStudentTestResultInput {
        student: ID!
        test: ID!
        marks: [MarkInput!]!
        average_mark: Float!
        mark_entry_date: String!
        student_test_result_status: StudentTestResultStatus!
    }

    type Mark {
        notation_text: String!
        mark: Float!
    }

    type StudentTestResult {
        id: ID!
        student: Student!
        test: Test!
        marks: Mark!
        average_mark: Float!
        mark_entry_date: String!
        student_test_result_status: StudentTestResultStatus!
        created_by: User!
        created_at: String!
        updated_by: User!
        updated_at: String!
        deleted_by: User
        deleted_at: String
    }

    type Query {
        GetAllStudentTestResult(student_test_result_status: StudentTestResultStatus): [StudentTestResult!]!
        GetOneStudentTestResult(id: ID!): StudentTestResult
    }

    type Mutation {
        UpdateStudentTestResult(id: ID!, UpdateStudentTestResultInput: UpdateStudentTestResultInput!): StudentTestResult!
        InvalidateStudentTestResult(id: ID!): StudentTestResult!
    }
`