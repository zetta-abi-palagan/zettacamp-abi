// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

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
            validate: (val) => typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
            message: 'A valid email address is required.',
        },
        {
            field: 'password',
            required: true, // Required only on create
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

    if (
        !context ||
        !context.dataLoaders ||
        !context.dataLoaders.UserLoader ||
        typeof context.dataLoaders.UserLoader.load !== 'function'
    ) {
        throw new ApolloError(
            'Server configuration error: UserLoader not found on context.',
            'INTERNAL_SERVER_ERROR'
        );
    }

    const userId = parent[fieldName];

    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApolloError(`Input error: If provided, parent.${fieldName} must be a valid ID.`, 'BAD_USER_INPUT');
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateUserInput,
    ValidateUserLoaderInput
}