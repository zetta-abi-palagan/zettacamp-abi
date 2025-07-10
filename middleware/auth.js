// *************** IMPORT LIBRARY ***************
const jwt = require('jsonwebtoken');
const { ApolloError, AuthenticationError, ForbiddenError } = require('apollo-server');
const { parse } = require('graphql');

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

/**
 * Verifies a JSON Web Token (JWT) and returns its decoded payload.
 * @param {string} token - The JWT string to be verified.
 * @returns {object} The decoded payload of the token, containing user ID and role.
 */
function VerifyToken(token) {
    if (!token || typeof token !== 'string') {
        throw new AuthenticationError('Token must be a string');
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);

        if (!decoded.role || !decoded._id) {
            throw new AuthenticationError('Token missing required fields');
        }

        return decoded;
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw new AuthenticationError('Token expired');
        }
        throw new AuthenticationError('Invalid token');
    }
}

/**
 * Authorizes an incoming GraphQL request based on a predefined access map.
 * It checks for a valid JWT, user roles, and can run additional custom validation logic.
 * @param {object} req - The incoming HTTP request object, containing headers.
 * @param {object} body - The parsed body of the request, containing the GraphQL query and variables.
 * @returns {object} An object containing the authenticated user's data, to be used as the GraphQL context.
 */
function AuthorizeRequest(req, body) {
    try {
        const authHeader = req.headers && req.headers.authorization;
        const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;

        const query = body && body.query;
        if (!query) throw new Error('Missing GraphQL query');

        const parsed = parse(query);

        const operationDef = parsed.definitions.find(
            (def) => def.kind === 'OperationDefinition'
        );

        if (!operationDef) {
            return { user: null };
        }

        const operationType = operationDef.operation.toUpperCase();

        let fieldName = null;
        if (
            operationDef.name &&
            typeof operationDef.name.value === 'string'
        ) {
            fieldName = operationDef.name.value;
        } else if (
            operationDef.selectionSet &&
            Array.isArray(operationDef.selectionSet.selections) &&
            operationDef.selectionSet.selections.length &&
            operationDef.selectionSet.selections[0].name &&
            typeof operationDef.selectionSet.selections[0].name.value === 'string'
        ) {
            fieldName = operationDef.selectionSet.selections[0].name.value;
        }

        if (!fieldName || fieldName.startsWith('__')) {
            return { user: null };
        }

        const accessConfig = accessMap[operationType] && accessMap[operationType][fieldName];
        let user;

        if (!accessConfig) {
            if (token) {
                try {
                    user = VerifyToken(token);
                } catch (error) {
                    user = null;
                }
            }
            return { user };
        }

        if (!token) throw new AuthenticationError('Missing auth token');

        user = VerifyToken(token);

        const allowedRoles = Array.isArray(accessConfig)
            ? accessConfig
            : accessConfig.roles || [];

        if (!allowedRoles.includes(user.role)) {
            throw new ForbiddenError('Unauthorized');
        }

        if (typeof accessConfig.validator === 'function') {
            if (user.role === 'STUDENT') {
                try {
                    accessConfig.validator({ user, variables: body.variables });
                } catch (err) {
                    throw new ForbiddenError('Authorization validation failed:', err.message);
                }
            }
        }

        return { user };
    } catch (error) {
        console.error('Auth error:', error);
        throw new ApolloError(`Auth failed: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}

// *************** EXPORT MODULE ***************s
module.exports = {
    GenerateToken,
    AuthorizeRequest
}