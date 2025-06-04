// *************** IMPORT LIBRARY ***************
const { gql } = require('apollo-server-express');

const scalarsTypeDefs = gql`
  scalar Date
`;

// *************** EXPORT MODULE ***************
module.exports = scalarsTypeDefs;