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
        name: String!
        description: String!
        evaluation_type: EvaluationType!
        block_type: BlockType!
        connected_block: ID
        is_counted_in_final_transcript: Boolean!
        block_status: BlockStatus!
    }

    type Block {
        id: ID!
        name: String!
        description: String!
        evaluation_type: EvaluationType!
        block_type: BlockType!
        connected_block: Block
        is_counted_in_final_transcript: Boolean!
        subjects: [Subject!]!
        block_status: BlockStatus!
        created_by: User!
        created_at: String!
        updated_by: User!
        updated_at: String!
        deleted_by: User
        deleted_at: String
    }

    type Query {
        GetAllBlocks(block_status: BlockStatus): [Block!]!
        GetOneBlock(id: ID!): Block
    }

    type Mutation {
        CreateBlock(input: CreateBlockInput!): Block!
        UpdateBlock(id: ID!, input: UpdateBlockInput!): Block!
        DeleteBlock(id: ID!): Block!
    }
`