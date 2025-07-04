// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** EXPORT MODULE ***************
module.exports = gql`
    enum SubjectStatus {
        ACTIVE
        INACTIVE
        DELETED
    }

    enum CriteriaType {
        MARK
        AVERAGE
    }

    enum ComparisonOperator {
        GTE
        LTE
        GT
        LT
        E
    }

    input CreateSubjectInput {
        block: ID!
        name: String!
        description: String!
        coefficient: Float!
        subject_status: SubjectStatus!
    }

    input UpdateSubjectInput {
        name: String
        description: String
        coefficient: Float
        connected_blocks: [ID!]
        subject_status: SubjectStatus
        subject_passing_criteria: SubjectPassingCriteriaInput
    }

    input SubjectPassingCriteriaInput {
        pass_criteria: SubjectCriteriaGroupListInput
        fail_criteria: SubjectCriteriaGroupListInput
    }

    input SubjectCriteriaGroupListInput {
        subject_criteria_groups: [SubjectCriteriaGroupInput!]
    }

    input SubjectCriteriaGroupInput {
        conditions: [SubjectPassingConditionInput!]
    }

    input SubjectPassingConditionInput {
        criteria_type: CriteriaType
        test: ID
        comparison_operator: ComparisonOperator
        mark: Float
    }

    type Subject {
        _id: ID!
        block: Block!
        name: String!
        description: String!
        coefficient: Float!
        is_transversal: Boolean!
        connected_blocks: [Block!]!
        tests: [Test!]!
        subject_status: SubjectStatus!
        subject_passing_criteria: SubjectPassingCriteria
        created_by: User!
        created_at: String!
        updated_by: User!
        updated_at: String!
        deleted_by: User
        deleted_at: String
    }

    type SubjectPassingCriteria {
        pass_criteria: SubjectCriteriaGroupList
        fail_criteria: SubjectCriteriaGroupList
    }

    type SubjectCriteriaGroupList {
        subject_criteria_groups: [SubjectCriteriaGroup!]
    }

    type SubjectCriteriaGroup {
        conditions: [SubjectPassingCondition!]
    }

    type SubjectPassingCondition {
        criteria_type: CriteriaType
        test: ID
        comparison_operator: ComparisonOperator
        mark: Float
    }

    type Query {
        GetAllSubjects(subject_status: SubjectStatus): [Subject!]!
        GetOneSubject(id: ID!): Subject
    }

    type Mutation {
        CreateSubject(createSubjectInput: CreateSubjectInput!): Subject!
        UpdateSubject(id: ID!, updateSubjectInput: UpdateSubjectInput!): Subject!
        DeleteSubject(id: ID!): Subject!
    }
`