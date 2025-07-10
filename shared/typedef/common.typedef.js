// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

// *************** EXPORT MODULE ***************
module.exports = gql`
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

    enum SortOrder {
        ASC
        DESC
    }

    input SortInput {
        field: String!
        order: SortOrder!
    }

    input UserReferenceFilterInput {
        first_name: String
        last_name: String
        email: String
        role: Role
    }
`