// *************** IMPORT LIBRARY *************** 
const validator = require('validator');

/**
 * Check if an email is valid.
 * @param {string} email - Email to validate.
 * @returns {Promise<boolean>}
 */
async function IsEmailValid(email) {
    if (!validator.isEmail(email)) {
        return false;
    }

    return true;
}

/**
 * Checks if the email is unique in the database.
 * @param {string} email - The email address to check for uniqueness.
 * @param {object} model - The Mongoose model (or similar) to query.
 * @returns {Promise<boolean>} - True if the email is unique, false if it already exists.
 * @throws {Error} - If there's a database error during the check.
 */
async function IsEmailUnique(email, model) {
    const query = {
        email: email,
        deleted_at: null
    };
    try {
        const existing = await model.findOne(query);
        return !existing;
    } catch (error) {
        throw new Error(`Database error while checking uniqueness for email: ${email} - ${error.message}`);
    }
}


// *************** EXPORT MODULE ***************
module.exports = { IsEmailValid, IsEmailUnique };