// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates that every element in an array is a valid MongoDB ObjectId.
 * @param {Array<string>} ids - The array of IDs to validate.
 * @param {string} errorCode - The error code to use if validation fails.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateObjectIdArray(ids, errorCode) {
    const allValid = ids.every(id => id && mongoose.Types.ObjectId.isValid(id));
    if (!allValid) {
        throw new ApolloError(`One or more IDs are invalid or empty`, errorCode);
    }
}

// *************** EXPORT MODULE ***************
module.exports = ValidateObjectIdArray;