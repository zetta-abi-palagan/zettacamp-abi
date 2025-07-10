// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** EXPORT MODULE ***************
module.exports = gql`
    enum Status {
        ACTIVE
        INACTIVE
        DELETED
    }

    input CreateStudentInput {
        first_name: String!
        last_name: String!
        email: String!
        password: String!
        date_of_birth: String!
        profile_picture: String
        student_status: Status!
        school: ID!
    }

    input UpdateStudentInput {
        first_name: String
        last_name: String
        email: String
        password: String
        date_of_birth: String
        profile_picture: String
        student_status: Status
        school: ID
    }

    input StudentFilterInput {
        first_name: String
        last_name: String
        email: String
        student_status: Status
        school: SchoolReferenceFilterInput
        created_by: UserReferenceFilterInput
        updated_by: UserReferenceFilterInput
    }

    input SchoolReferenceFilterInput {
        commercial_name: String
        legal_name: String
        city: String
        country: String
        school_status: Status
    }

    type PaginatedStudents {
        data: [Student!]!
        countDocuments: Int!
    }

    type Student {
        _id: ID!
        first_name: String!
        last_name: String!
        email: String!
        date_of_birth: String!
        profile_picture: String
        student_status: Status!
        school: School!
        created_by: User!
        created_at: String!
        updated_by: User!
        updated_at: String!
    }

    type Query {
        GetAllStudents(
            filter: StudentFilterInput, 
            sort: SortInput, 
            page: Int, 
            limit: Int
        ): PaginatedStudents!
        GetOneStudent(id: ID!): Student
    }

    type Mutation {
        CreateStudent(createStudentInput: CreateStudentInput!): Student!
        UpdateStudent(id: ID!, updateStudentInput: UpdateStudentInput!): Student!
        DeleteStudent(id: ID!): Student!
    }
`