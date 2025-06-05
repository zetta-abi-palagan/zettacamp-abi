// *************** IMPORT LIBRARY ***************
const mongoose = require('mongoose');

/**
 * Checks if a value is a valid Mongoose ObjectId
 * @param {string} id
 * @returns {boolean}
 */
function IsValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// *************** EXPORT MODULE ***************
module.exports = { IsValidObjectId };