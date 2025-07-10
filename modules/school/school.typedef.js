// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** EXPORT MODULE ***************
module.exports = gql`
    enum Status {
        ACTIVE
        INACTIVE
        DELETED
    }

    input CreateSchoolInput {
        commercial_name: String!
        legal_name: String!
        address: String!
        city: String!
        country: String!
        zipcode: String!
        logo: String
        school_status: Status!
    }

    input UpdateSchoolInput {
        commercial_name: String
        legal_name: String
        address: String
        city: String
        country: String
        zipcode: String
        logo: String
        school_status: Status
    }

    input SchoolFilterInput {
        commercial_name: String
        legal_name: String
        city: String
        country: String
        zipcode: String
        school_status: Status
        students: StudentReferenceFilterInput
        created_by: UserReferenceFilterInput
        updated_by: UserReferenceFilterInput
    }

    input StudentReferenceFilterInput {
        first_name: String
        last_name: String
        email: String
        student_status: Status
    }

    type PaginatedSchools{
        data: [School!]!
        countDocuments: Int!
    }

    type School {
        _id: ID!
        commercial_name: String!
        legal_name: String!
        address: String!
        city: String!
        country: String!
        zipcode: String!
        logo: String
        school_status: Status!
        students: [Student!]!
        created_by: User!
        created_at: String!
        updated_by: User!
        updated_at: String!
    }

    type Query {
        GetAllSchools(
        filter: SchoolFilterInput,
        sort: SortInput,
        page: Int,
        limit: Int
        ): PaginatedSchools!
        GetOneSchool(id: ID!): School
    }

    type Mutation {
        CreateSchool(createSchoolInput: CreateSchoolInput!): School!
        UpdateSchool(id: ID!, updateSchoolInput: UpdateSchoolInput!): School!
        DeleteSchool(id: ID!): School!
    }
`