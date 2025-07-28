// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates if the provided value is a valid MongoDB ObjectId.
 * @param {string} id - The ID to be validated.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateObjectId(id) {
  if (!id) {
    throw new ApolloError('Input error: ID must be a non-empty string.', 'BAD_USER_INPUT');
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApolloError(`Invalid ID: ${id}`, 'BAD_USER_INPUT');
  }
}

// *************** EXPORT MODULE ***************
module.exports = ValidateObjectId;
