// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const schoolTypeDefs = gql`
  type School {
    id: ID!
    name: String!
    address: String
    students: [Student]
    deleted_at: Date
  }

  input CreateSchoolInput {
    name: String!
    address: String
  }

  input UpdateSchoolInput {
    name: String
    address: String
  }

  type Query {
    GetAllSchools: [School!]!
    GetOneSchool(id: ID!): School
  }

  type Mutation {
    CreateSchool(input: CreateSchoolInput!): School!
    UpdateSchool(id: ID!, input: UpdateSchoolInput!): School!
    DeleteSchool(id: ID!): School!
  }
`;

// *************** EXPORT MODULE ***************
module.exports = schoolTypeDefs;