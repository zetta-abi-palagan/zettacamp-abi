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
 * Authorizes an incoming GraphQL request by checking it against a predefined access map.
 * @param {object} req - The incoming HTTP request object, containing headers.
 * @param {object} body - The parsed body of the request, containing the GraphQL query and variables.
 * @returns {Promise<object>} A promise that resolves to an object containing the authenticated user's data for the GraphQL context.
 */
function AuthorizeRequest(req, body) {
  try {
    // *************** Extract token from Authorization header
    const token = ExtractBearerToken(req);

    // *************** Parse GraphQL operation type and field name
    const operation = GetGraphQLOperation(body && body.query);

    // *************** If operation can't be determined, return unauthenticated
    if (!operation) {
      return { user: null };
    }

    const { operationType, fieldName } = operation;

    // *************** Get access configuration for this operation
    const accessConfig = accessMap[operationType] && accessMap[operationType][fieldName];

    // *************** If no access config, try to verify token if present, else unauthenticated
    if (!accessConfig) {
      if (token) {
        try {
          const user = VerifyToken(token);
          return { user };
        } catch (error) {
          return { user: null };
        }
      }
      return { user: null };
    }

    // *************** Require token for protected operation
    if (!token) {
      throw new AuthenticationError('An authentication token is required.');
    }

    // *************** Verify token and extract user
    const user = VerifyToken(token);

    // *************** Check if user role is allowed for this operation
    CheckUserRole({ user, accessConfig });

    // *************** Run custom validator if defined in access config
    RunCustomValidator({ accessConfig, user, variables: body.variables });

    // *************** Return authenticated user for context
    return { user };
  } catch (error) {
    console.error('Auth error:', error);

    throw new ApolloError(`Auth failed: ${error.message}`, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * Extracts the Bearer token from the request's Authorization header.
 * @param {object} req - The request object.
 * @returns {string|null} The token or null if not found.
 */
function ExtractBearerToken(req) {
  const authHeader = req.headers && req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  // *************** Remove "Bearer " prefix to get the raw token
  const token = authHeader.replace(/^Bearer\s+/i, '');

  return token;
}

/**
 * Parses a GraphQL query to extract the operation type and field name.
 * @param {string} query - The GraphQL query string from the request body.
 * @returns {{operationType: string, fieldName: string}|null} Operation details or null.
 */
function GetGraphQLOperation(query) {
  if (!query) {
    throw new Error('Missing GraphQL query');
  }

  // *************** Parse the GraphQL query into AST
  const parsed = parse(query);

  // *************** Find the main operation definition (query/mutation/subscription)
  const operationDef = parsed.definitions.find((def) => def.kind === 'OperationDefinition');

  if (!operationDef) {
    return null;
  }

  // *************** Extract operation type (QUERY, MUTATION, etc.)
  const operationType = operationDef.operation.toUpperCase();

  let fieldName;

  // *************** Extract the first field name from the selection set
  if (operationDef.selectionSet && Array.isArray(operationDef.selectionSet.selections) && operationDef.selectionSet.selections.length) {
    fieldName = operationDef.selectionSet.selections[0].name.value;
  }

  // *************** Return operation type and field name
  return { operationType, fieldName };
}

/**
 * Authorizes a user based on their role against an access configuration.
 * @param {object} user - The authenticated user object, containing a 'role'.
 * @param {object|string[]} accessConfig - The configuration defining allowed roles.
 * @throws {ForbiddenError} If the user's role is not permitted.
 */
function CheckUserRole({ user, accessConfig }) {
  const allowedRoles = Array.isArray(accessConfig) ? accessConfig : accessConfig.roles || [];

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError('You are not authorized to perform this action.');
  }
}

/**
 * Runs a custom validation function if it exists for the given access config.
 * @param {object} accessConfig - The access configuration.
 * @param {object} user - The authenticated user.
 * @param {object} variables - The GraphQL variables.
 * @throws {ForbiddenError} If the custom validation fails.
 */
function RunCustomValidator({ accessConfig, user, variables }) {
  const needsValidation = typeof accessConfig.validator === 'function' && user.role === 'STUDENT';

  if (!needsValidation) {
    return;
  }

  try {
    accessConfig.validator({ user, variables });
  } catch (err) {
    throw new ForbiddenError(`Authorization validation failed: ${err.message}`);
  }
}

// *************** EXPORT MODULE ***************s
module.exports = {
  GenerateToken,
  AuthorizeRequest,
};
