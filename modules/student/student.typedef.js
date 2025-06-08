// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const studentTypeDefs = gql`
  type Student {
    id: ID!
    first_name: String!
    last_name: String!
    email: String!
    date_of_birth: String
    school_id: ID!
    deleted_at: String
  }

  input CreateStudentInput {
    first_name: String!
    last_name: String!
    email: String!
    date_of_birth: String
    school_id: ID!
  }

  input UpdateStudentInput {
    first_name: String
    last_name: String
    email: String
    date_of_birth: String
    school_id: ID
  }

  type Query {
    GetAllStudents: [Student!]!
    GetOneStudent(id: ID!): Student
  }

  type Mutation {
    CreateStudent(input: CreateStudentInput!): Student!
    UpdateStudent(id: ID!, input: UpdateStudentInput!): Student!
    DeleteStudent(id: ID!): Student!
  }
`;

// *************** EXPORT MODULE ***************
module.exports = studentTypeDefs;