// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** EXPORT MODULE ***************
module.exports = gql`
    enum EvaluationType {
        COMPETENCY
        SCORE
    }

    enum BlockType {
        REGULAR
        COMPETENCY
        SOFT_SKILL
        ACADEMIC_RECOMMENDATION
        SPECIALIZATION
        TRANSVERSAL
        RETAKE
    }
    
    enum BlockStatus {
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

    enum LogicalOperator {
        AND
        OR
    }
    
    input CreateBlockInput {
        name: String!
        description: String!
        evaluation_type: EvaluationType!
        block_type: BlockType!
        connected_block: ID
        is_counted_in_final_transcript: Boolean!
        block_status: BlockStatus!
    }

    input UpdateBlockInput {
        name: String
        description: String
        evaluation_type: EvaluationType
        block_type: BlockType
        connected_block: ID
        is_counted_in_final_transcript: Boolean
        block_status: BlockStatus
        block_passing_criteria: BlockPassingCriteriaInput
    }

    input BlockPassingCriteriaInput {
        logical_operator: LogicalOperator!
        conditions: [BlockPassingConditionInput!]!
    }

    input BlockPassingConditionInput {
        criteria_type: CriteriaType
        subject: ID
        comparison_operator: ComparisonOperator
        mark: Float
        logical_operator: LogicalOperator
        conditions: [BlockPassingConditionInput!]
    }

    type Block {
        _id: ID!
        name: String!
        description: String!
        evaluation_type: EvaluationType!
        block_type: BlockType!
        connected_block: Block
        is_counted_in_final_transcript: Boolean!
        subjects: [Subject!]!
        block_status: BlockStatus!
        block_passing_criteria: BlockPassingCriteria
        created_by: User!
        created_at: String!
        updated_by: User!
        updated_at: String!
        deleted_by: User
        deleted_at: String
    }

    type BlockPassingCriteria {
        logical_operator: LogicalOperator
        conditions: [BlockPassingCondition!]
    }

    type BlockPassingCondition {
        criteria_type: CriteriaType
        subject: Subject
        comparison_operator: ComparisonOperator
        mark: Float
        logical_operator: LogicalOperator
        conditions: [BlockPassingCondition!]
    }

    type Query {
        GetAllBlocks(block_status: BlockStatus): [Block!]!
        GetOneBlock(id: ID!): Block
    }

    type Mutation {
        CreateBlock(createBlockInput: CreateBlockInput!): Block!
        UpdateBlock(id: ID!, updateBlockInput: UpdateBlockInput!): Block!
        DeleteBlock(id: ID!): Block!
    }
`