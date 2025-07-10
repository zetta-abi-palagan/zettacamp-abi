// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

/**
 * Validates the filter, sort, and pagination inputs for fetching all students.
 * @param {object} args - The arguments for the validation.
 * @param {object} [args.filter] - Optional. An object containing fields to filter the student list, including nested filters.
 * @param {object} [args.sort] - Optional. An object specifying the sorting field and order.
 * @param {number} [args.page] - Optional. The page number for pagination.
 * @param {number} [args.limit] - Optional. The number of students per page.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateGetAllStudentsInput({ filter, sort, page, limit }) {
    const allowedRoles = ['ADMIN', 'USER', 'ACADEMIC_DIRECTOR', 'CORRECTOR'];
    const allowedStatus = ['ACTIVE', 'INACTIVE'];

    if (filter) {
        if (filter.email && !emailRegex.test(filter.email)) {
            throw new ApolloError('Invalid email format in student filter.', 'BAD_USER_INPUT');
        }
        if (filter.student_status && !allowedStatus.includes(filter.student_status)) {
            throw new ApolloError('Invalid status in student filter.', 'BAD_USER_INPUT');
        }

        if (filter.school) {
            if (filter.school.school_status && !allowedStatus.includes(filter.school.school_status)) {
                throw new ApolloError('Invalid status in school filter.', 'BAD_USER_INPUT');
            }
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
 * Validates the input object for creating or updating a student using a rule-based approach.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.studentInput - An object containing the student's properties to be validated.
 * @param {string} [args.studentInput.first_name] - The student's first name.
 * @param {string} [args.studentInput.last_name] - The student's last name.
 * @param {string} [args.studentInput.email] - The student's email address.
 * @param {string} [args.studentInput.password] - The student's password (required on create).
 * @param {Date|string} [args.studentInput.date_of_birth] - The student's date of birth.
 * @param {string} [args.studentInput.profile_picture] - Optional. A URL to the student's profile picture.
 * @param {string} [args.studentInput.student_status] - The student's status (e.g., 'ACTIVE').
 * @param {string} [args.studentInput.school] - The ID of the school the student belongs to.
 * @param {boolean} args.isEmailUnique - A flag indicating if the provided email is unique in the database.
 * @param {boolean} [args.isUpdate=false] - Optional flag to indicate if this is an update operation.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateStudentInput({ studentInput, isEmailUnique, isUpdate = false }) {
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
            required: true,
            validate: (val) => typeof val === 'string' && val.trim() !== '',
            message: 'Password is required.',
        },
        {
            field: 'date_of_birth',
            required: true,
            validate: (val) => !isNaN(new Date(val).getTime()),
            message: 'A valid date of birth format is required.',
        },
        {
            field: 'profile_picture',
            required: false,
            validate: (val) => typeof val === 'string' && val.startsWith('http'),
            message: 'Profile picture must be a valid URL.',
        },
        {
            field: 'student_status',
            required: true,
            validate: (val) => typeof val === 'string' && validStatus.includes(val.toUpperCase()),
            message: `Student status must be one of: ${validStatus.join(', ')}.`,
        },
        {
            field: 'school',
            required: true,
            validate: (val) => mongoose.Types.ObjectId.isValid(val),
            message: 'A valid school ID is required.',
        },
    ];

    for (const rule of validationRules) {
        const value = studentInput[rule.field];

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
 * Validates the inputs for the SchoolLoader resolver on the Student type.
 * @param {object} student - The parent student object, which must contain a 'school' property with a valid ObjectID.
 * @param {object} context - The GraphQL context, which must contain a configured SchoolLoader.
 * @returns {void} - This function does not return a value but throws an error if validation fails.
 */
function ValidateSchoolLoaderInput(student, context) {
    if (!student || typeof student !== 'object' || student === null) {
        throw new ApolloError('Input error: student must be a valid object.', 'BAD_USER_INPUT', { field: 'student' });
    }
    if (!mongoose.Types.ObjectId.isValid(student.school)) {
        throw new ApolloError('Input error: student.school must be a valid ID.', 'BAD_USER_INPUT', { field: 'student.school' });
    }
    if (!context || !context.dataLoaders || !context.dataLoaders.SchoolLoader || typeof context.dataLoaders.SchoolLoader.load !== 'function') {
        throw new ApolloError('Server configuration error: SchoolLoader with load function not found on context.', 'INTERNAL_SERVER_ERROR');
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
    ValidateGetAllStudentsInput,
    ValidateStudentInput,
    ValidateSchoolLoaderInput,
    ValidateUserLoaderInput
}