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
`