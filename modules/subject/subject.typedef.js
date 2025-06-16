// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** EXPORT MODULE ***************
module.exports = gql`
    enum SubjectStatus {
        ACTIVE
        INACTIVE
        DELETED
    }

    input CreateSubjectInput {
        block: ID!
        name: String!
        description: String!
        coefficient: Float!
        subject_status: SubjectStatus!
    }

    input UpdateSubjectInput {
        name: String!
        description: String!
        coefficient: Float!
        connected_blocks: [ID!]
        subject_status: SubjectStatus!
    }

    type Subject {
        id: ID!
        block: Block!
        name: String!
        description: String!
        coefficient: Float!
        is_transversal: Boolean!
        connected_blocks: [Block!]!
        # tests: [Test!]!
        subject_status: SubjectStatus!
        created_by: User!
        created_at: String!
        updated_by: User!
        updated_at: String!
        deleted_by: User
        deleted_at: String
    }

    type Query {
        GetAllSubjects(subject_status: SubjectStatus): [Subject!]!
        GetOneSubject(id: ID!): Subject
    }

    type Mutation {
        CreateSubject(input: CreateSubjectInput!): Subject!
        UpdateSubject(id: ID!, input: UpdateSubjectInput!): Subject!
        DeleteSubject(id: ID!): Subject!
    }
`