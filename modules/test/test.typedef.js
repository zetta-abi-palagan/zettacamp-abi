// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** EXPORT MODULE ***************
module.exports = gql`
    enum TestType {
        FREE_CONTINUOUS_CONTROL
        MEMMOIRE_ORAL_NON_JURY
        MEMOIRE_ORAL
        MEMOIRE_WRITTEN
        MENTOR_EVALUATION
        ORAL
        WRITTEN
    }

    enum ResultVisibility {
        NEVER
        AFTER_CORRECTION
        AFTER_JURY_DECISION_FOR_FINAL_TRANSCRIPT
    }

    enum CorrectionType {
        ADMTC
        CERTIFIER
        CROSS_CORRECTION
        PREPARATION_CENTER
    }

    enum TestStatus {
        ACTIVE
        INACTIVE
        DELETED
    }

    input NotationInput {
        notation_text: String!
        max_points: Float!
    }

    input CreateTestInput {
        subject: ID!
        name: String!
        description: String!
        test_type: TestType!
        result_visibility: ResultVisibility!
        weight: Float!
        correction_type: CorrectionType!
        notations: [NotationInput!]!
        is_retake: Boolean!
        connected_test: ID
        test_status: TestStatus!
    }

    input UpdateTestInput {
        name: String!
        description: String!
        test_type: TestType!
        result_visibility: ResultVisibility!
        weight: Float!
        correction_type: CorrectionType!
        notations: [NotationInput!]!
        is_retake: Boolean!
        connected_test: ID
        test_status: TestStatus!
    }

    type Notation {
        notation_text: String!
        max_points: Float!
    }

    type Test {
        _id: ID!
        subject: Subject!
        name: String!
        description: String!
        test_type: TestType!
        result_visibility: ResultVisibility!
        weight: Float!
        correction_type: CorrectionType!
        notations: [Notation!]!
        test_status: TestStatus!
        is_published: Boolean!
        published_date: String
        published_by: User
        test_due_date: String
        student_test_results: [StudentTestResult!]!
        tasks: [Task!]!
        created_by: User!
        created_at: String!
        updated_by: User!
        updated_at: String!
        deleted_by: User
        deleted_at: String
    }

    type PublishTestPayload {
        test: Test!
        assign_corrector_task: Task!
    }

    type Query {
        GetAllTests(test_status: TestStatus): [Test!]!
        GetOneTest(id: ID!): Test
    }

    type Mutation {
        CreateTest(createTestInput: CreateTestInput!): Test!
        PublishTest(id: ID!, assign_corrector_due_date: String, test_due_date: String): PublishTestPayload!
        UpdateTest(id: ID!, updateTestInput: UpdateTestInput!): Test!
        DeleteTest(id: ID!): Test!
    }
`