// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the filter, sort, and pagination inputs for fetching all users.
 * @param {object} args - The arguments for the validation.
 * @param {object} [args.filter] - Optional. An object containing fields to filter the user list.
 * @param {object} [args.sort] - Optional. An object specifying the sorting field and order.
 * @param {number} [args.page] - Optional. The page number for pagination.
 * @param {number} [args.limit] - Optional. The number of users per page.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetAllUsersInput({ filter, sort, page, limit }) {
  const allowedRoles = ['ADMIN', 'USER', 'ACADEMIC_DIRECTOR', 'CORRECTOR'];
  const allowedStatus = ['ACTIVE', 'INACTIVE'];

  if (filter) {
    if (filter.email && !emailRegex.test(filter.email)) {
      throw new ApolloError('Invalid email format in filter.', 'BAD_USER_INPUT');
    }
    if (filter.role && !allowedRoles.includes(filter.role)) {
      throw new ApolloError('Invalid role in filter.', 'BAD_USER_INPUT');
    }
    if (filter.user_status && !allowedStatus.includes(filter.user_status)) {
      throw new ApolloError('Invalid status in filter.', 'BAD_USER_INPUT');
    }

    if (filter.created_by) {
      if (filter.created_by.email && !emailRegex.test(filter.created_by.email)) {
        throw new ApolloError('Invalid email format in created_by filter.', 'BAD_USER_INPUT');
      }
      if (filter.created_by.role && !allowedRoles.includes(filter.created_by.role)) {
        throw new ApolloError('Invalid role in created_by filter.', 'BAD_USER_INPUT');
      }
    }

    if (filter.updated_by) {
      if (filter.updated_by.email && !emailRegex.test(filter.updated_by.email)) {
        throw new ApolloError('Invalid email format in updated_by filter.', 'BAD_USER_INPUT');
      }
      if (filter.updated_by.role && !allowedRoles.includes(filter.updated_by.role)) {
        throw new ApolloError('Invalid role in updated_by filter.', 'BAD_USER_INPUT');
      }
    }
  }

  if (sort) {
    if (!sort.field || typeof sort.field !== 'string') {
      throw new ApolloError('Sort field must be a non-empty string.', 'BAD_USER_INPUT');
    }
    // Allowing dot notation for relational sorting
    if (!/^[a-zA-Z0-9_.]+$/.test(sort.field)) {
      throw new ApolloError('Sort field contains invalid characters.', 'BAD_USER_INPUT');
    }
    if (!sort.order || !['ASC', 'DESC'].includes(sort.order.toUpperCase())) {
      throw new ApolloError('Sort order must be either "ASC" or "DESC".', 'BAD_USER_INPUT');
    }
  }

  if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
    throw new ApolloError('Page must be a positive integer.', 'BAD_USER_INPUT');
  }

  if (limit !== undefined && (!Number.isInteger(limit) || limit < 1)) {
    throw new ApolloError('Limit must be a positive integer.', 'BAD_USER_INPUT');
  }
}

/**
 * Validates the input object for creating or updating a user using a rule-based approach.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.userInput - An object containing the user's properties to be validated.
 * @param {string} [args.userInput.first_name] - The user's first name.
 * @param {string} [args.userInput.last_name] - The user's last name.
 * @param {string} [args.userInput.email] - The user's email address.
 * @param {string} [args.userInput.password] - The user's password (required on create).
 * @param {string} [args.userInput.role] - The user's role (e.g., 'ADMIN', 'USER').
 * @param {string} [args.userInput.profile_picture] - Optional. A URL to the user's profile picture.
 * @param {string} [args.userInput.user_status] - The user's status (e.g., 'ACTIVE').
 * @param {boolean} args.isEmailUnique - A flag indicating if the provided email is unique in the database.
 * @param {boolean} [args.isUpdate=false] - Optional flag to indicate if this is an update operation, which allows for partial data.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateUserInput({ userInput, isEmailUnique, isUpdate = false }) {
  const validRoles = ['ADMIN', 'USER', 'ACADEMIC_DIRECTOR', 'CORRECTOR'];
  const validStatus = ['ACTIVE', 'INACTIVE'];

  const validationRules = [
    {
      field: 'first_name',
      required: true,
      validate: (val) => typeof val === 'string' && val.trim() !== '',
      message: 'First name is required.',
    },
    {
      field: 'last_name',
      required: true,
      validate: (val) => typeof val === 'string' && val.trim() !== '',
      message: 'Last name is required.',
    },
    {
      field: 'email',
      required: true,
      validate: (val) => typeof val === 'string' && emailRegex.test(val),
      message: 'A valid email address is required.',
    },
    {
      field: 'password',
      required: true,
      validate: (val) => typeof val === 'string' && val.trim() !== '',
      message: 'Password is required.',
    },
    {
      field: 'role',
      required: true,
      validate: (val) => typeof val === 'string' && validRoles.includes(val.toUpperCase()),
      message: `Role must be one of: ${validRoles.join(', ')}.`,
    },
    {
      field: 'profile_picture',
      required: false,
      validate: (val) => typeof val === 'string' && val.startsWith('http'),
      message: 'Profile picture must be a valid URL.',
    },
    {
      field: 'user_status',
      required: true,
      validate: (val) => typeof val === 'string' && validStatus.includes(val.toUpperCase()),
      message: `User status must be one of: ${validStatus.join(', ')}.`,
    },
  ];

  for (const rule of validationRules) {
    const value = userInput[rule.field];

    if ((!isUpdate && rule.required) || value !== undefined) {
      if (!rule.validate(value)) {
        const message = typeof rule.message === 'function' ? rule.message(value) : rule.message;
        throw new ApolloError(message, 'BAD_USER_INPUT', { field: rule.field });
      }
    }
  }

  if (!isEmailUnique) {
    throw new ApolloError('The email address is already in use.', 'BAD_USER_INPUT', { field: 'email' });
  }
}

/**
 * Validates the input object for a user login.
 * @param {object} loginInput - The object containing the user's login credentials.
 * @param {string} loginInput.email - The user's email address.
 * @param {string} loginInput.password - The user's password.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateLoginInput(loginInput) {
  const { email, password } = loginInput;

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApolloError('A valid email address is required.', 'BAD_USER_INPUT', { field: 'email' });
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    throw new ApolloError('Password is required.', 'BAD_USER_INPUT', { field: 'password' });
  }
}

/**
 * Validates the inputs for resolvers that use the UserLoader.
 * @param {object} parent - The parent object.
 * @param {object} context - The GraphQL context, which must contain a configured UserLoader.
 * @param {string} fieldName - The name of the property on the block object that holds the user ID (e.g., 'created_by').
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateUserLoaderInput(parent, context, fieldName) {
  if (!parent || typeof parent !== 'object' || parent === null) {
    throw new ApolloError('Input error: parent must be a valid object.', 'BAD_USER_INPUT');
  }

  if (!context || !context.dataLoaders || !context.dataLoaders.UserLoader || typeof context.dataLoaders.UserLoader.load !== 'function') {
    throw new ApolloError('Server configuration error: UserLoader not found on context.', 'INTERNAL_SERVER_ERROR');
  }

  const userId = parent[fieldName];

  if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApolloError(`Input error: If provided, parent.${fieldName} must be a valid ID.`, 'BAD_USER_INPUT');
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  ValidateGetAllUsersInput,
  ValidateUserInput,
  ValidateLoginInput,
  ValidateUserLoaderInput,
};
