// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** EXPORT MODULE ***************
module.exports = gql`
  enum Role {
    ADMIN
    USER
    CORRECTOR
    ACADEMIC_DIRECTOR
  }

  enum Status {
    ACTIVE
    INACTIVE
    DELETED
  }

  input CreateUserInput {
    first_name: String!
    last_name: String!
    email: String!
    password: String!
    role: Role!
    profile_picture: String
    user_status: Status!
  }

  input UpdateUserInput {
    first_name: String
    last_name: String
    email: String
    password: String
    role: Role
    profile_picture: String
    user_status: Status
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UserFilterInput {
    first_name: String
    last_name: String
    email: String
    role: Role
    user_status: Status
    created_by: UserReferenceFilterInput
    updated_by: UserReferenceFilterInput
  }

  type PaginatedUsers {
    data: [User!]!
    countDocuments: Int!
  }

  type LoginResponse {
    token: String!
    user: User!
  }

  type User {
    _id: ID!
    first_name: String!
    last_name: String!
    email: String!
    role: Role!
    profile_picture: String
    user_status: Status!
    created_by: User!
    created_at: String!
    updated_by: User!
    updated_at: String!
  }

  type Query {
    GetAllUsers(filter: UserFilterInput, sort: SortInput, page: Int, limit: Int): PaginatedUsers!
    GetOneUser(id: ID!): User
  }

  type Mutation {
    CreateUser(createUserInput: CreateUserInput!): User!
    UpdateUser(id: ID!, updateUserInput: UpdateUserInput!): User!
    DeleteUser(id: ID!): User!
    Login(loginInput: LoginInput!): LoginResponse!
  }
`;
