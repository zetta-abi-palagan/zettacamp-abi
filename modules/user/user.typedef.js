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
        first_name: String!
        last_name: String!
        email: String!
        role: Role!
        profile_picture: String
        user_status: Status!
    }

    type Query {
        GetAllUsers: [User!]!
        GetOneUser(id: ID!): User
    }

    type Mutation {
        CreateUser(input: CreateUserInput!): User!
        UpdateUser(id: ID!, input: UpdateUserInput!): User!
        DeleteUser(id: ID!): User!
    }
`