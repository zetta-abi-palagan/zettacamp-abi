// *************** IMPORT LIBRARY ***************
const jwt = require('jsonwebtoken');
const { ApolloError, AuthenticationError, ForbiddenError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const config = require('../core/config');
const accessMap = require('./access_map');

/**
 * Generates a JSON Web Token (JWT) for a given user.
 * @param {object} user - The user object for whom to generate the token. Must contain _id and role properties.
 * @returns {string} The generated JWT string.
 */
function GenerateToken(user) {
    if (!user || !user._id || !user.role) {
        throw new ApolloError('Invalid user object provided for token generation.', 'INTERNAL_SERVER_ERROR');
    }

    const token = jwt.sign({ _id: user._id, role: user.role }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRATION });

    return token;
}

module.exports = {
    GenerateToken,
}