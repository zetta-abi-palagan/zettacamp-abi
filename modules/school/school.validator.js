// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates the input object for creating or updating a school using a rule-based approach.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.schoolInput - An object containing the school's properties to be validated.
 * @param {string} [args.schoolInput.commercial_name] - The school's commercial name.
 * @param {string} [args.schoolInput.legal_name] - The school's legal name.
 * @param {string} [args.schoolInput.address] - The school's address.
 * @param {string} [args.schoolInput.city] - The city where the school is located.
 * @param {string} [args.schoolInput.country] - The country where the school is located.
 * @param {string} [args.schoolInput.zipcode] - The zipcode of the school's location.
 * @param {string} [args.schoolInput.logo] - Optional. A URL to the school's logo.
 * @param {string} [args.schoolInput.school_status] - The school's status (e.g., 'ACTIVE').
 * @param {boolean} [args.isUpdate=false] - Optional flag to indicate if this is an update operation, which allows for partial data.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateSchoolInput({ schoolInput, isUpdate = false }) {
    const validStatus = ['ACTIVE', 'INACTIVE'];

    const validationRules = [
        {
            field: 'commercial_name',
            required: true,
            validate: (val) => typeof val === 'string' && val.trim() !== '',
            message: 'Commercial name is required.',
        },
        {
            field: 'legal_name',
            required: true,
            validate: (val) => typeof val === 'string' && val.trim() !== '',
            message: 'Legal name is required.',
        },
        {
            field: 'address',
            required: true,
            validate: (val) => typeof val === 'string' && val.trim() !== '',
            message: 'Address is required.',
        },
        {
            field: 'city',
            required: true,
            validate: (val) => typeof val === 'string' && val.trim() !== '',
            message: 'City is required.',
        },
        {
            field: 'country',
            required: true,
            validate: (val) => typeof val === 'string' && val.trim() !== '',
            message: 'Country is required.',
        },
        {
            field: 'zipcode',
            required: true,
            validate: (val) => typeof val === 'string' && val.trim() !== '',
            message: 'Zipcode is required.',
        },
        {
            field: 'logo',
            required: false,
            validate: (val) => typeof val === 'string' && val.startsWith('http'),
            message: 'Logo must be a valid URL.',
        },
        {
            field: 'school_status',
            required: true,
            validate: (val) => typeof val === 'string' && validStatus.includes(val.toUpperCase()),
            message: `School status must be one of: ${validStatus.join(', ')}.`,
        },
    ];

    for (const rule of validationRules) {
        const value = schoolInput[rule.field];

        if ((!isUpdate && rule.required) || value !== undefined) {
            if (!rule.validate(value)) {
                const message = typeof rule.message === 'function' ? rule.message(value) : rule.message;
                throw new ApolloError(message, 'BAD_USER_INPUT', { field: rule.field });
            }
        }
    }
}

/**
 * Validates the inputs for the StudentLoader resolver on the School type.
 * @param {object} school - The parent school object, which must contain a 'students' array of valid ObjectIDs.
 * @param {object} context - The GraphQL context, which must contain a configured StudentLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateStudentLoaderInput(school, context) {
    CommonValidator.ValidateInputTypeObject(school);
    if (!Array.isArray(school.students)) {
        throw new ApolloError('Input error: school.students must be an array.', 'BAD_USER_INPUT', {
            field: 'school.students'
        });
    }
    for (const studentId of school.students) {
        CommonValidator.ValidateObjectId(studentId);
    }
    if (!context || !context.dataLoaders || !context.dataLoaders.StudentLoader || typeof context.dataLoaders.StudentLoader.loadMany !== 'function') {
        throw new ApolloError('Server configuration error: StudentLoader with loadMany function not found on context.', 'INTERNAL_SERVER_ERROR');
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
    ValidateSchoolInput,
    ValidateStudentLoaderInput,
    ValidateUserLoaderInput
}