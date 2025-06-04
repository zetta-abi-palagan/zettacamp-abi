// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const userTypeDefs = gql`
  type User {
    id: ID!
    first_name: String!
    last_name: String!
    email: String!
    role: String!
    deleted_at: Date
  }

  input CreateUserInput {
    first_name: String!
    last_name: String!
    email: String!
    password: String!
    role: String!
  }

  input UpdateUserInput {
    first_name: String
    last_name: String
    email: String
    role: String
  }

  type Query {
    Users: [User!]!
    User(id: ID!): User
  }

  type Mutation {
    CreateUser(input: CreateUserInput!): User!
    UpdateUser(id: ID!, input: UpdateUserInput!): User!
    DeleteUser(id: ID!): User!
  }
`;

// *************** EXPORT MODULE ***************
module.exports = userTypeDefs;