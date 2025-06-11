// *************** IMPORT LIBRARY ***************
const bcrypt = require('bcrypt');
const { ApolloError } = require('apollo-server');
const mongoose = require('mongoose');
const validator = require('validator');

// *************** IMPORT MODULE *************** 
const UserModel = require('./user.model');

// *************** QUERY ***************
/**
 * Fetches all users with an 'ACTIVE' status.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of active user objects.
 */
async function GetAllUsers() {
    try {
        return await UserModel.find({ user_status: 'ACTIVE' });
    } catch (error) {
        throw new ApolloError(`Failed to fetch users: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Fetches a single active user by their unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The unique identifier of the user to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found user object.
 */
async function GetOneUser(_, { id }) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    try {
        const user = await UserModel.findOne({ _id: id, user_status: 'ACTIVE' })
        if (!user) {
            throw new ApolloError("User not found", "NOT_FOUND");
        }

        return user;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

// *************** MUTATION ***************
/**
 * Creates a new user with the provided input data.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {object} args.input - The data for the new user.
 * @returns {Promise<object>} - A promise that resolves to the newly created user object.
 */
async function CreateUser(_, { input }) {
    const {
        first_name,
        last_name,
        email,
        password,
        role,
        profile_picture,
        user_status
    } = input;

    const validRoles = ['ADMIN', 'USER'];
    const validStatus = ['ACTIVE', 'INACTIVE'];

    if (!first_name || validator.isEmpty(first_name, { ignore_whitespace: true })) {
        throw new ApolloError('First name is required.', 'BAD_USER_INPUT', {
            field: 'first_name'
        });
    }

    if (!last_name || validator.isEmpty(last_name, { ignore_whitespace: true })) {
        throw new ApolloError('Last name is required.', 'BAD_USER_INPUT', {
            field: 'last_name'
        });
    }

    if (!email || !validator.isEmail(email)) {
        throw new ApolloError('A valid email address is required.', 'BAD_USER_INPUT', {
            field: 'email'
        });
    }

    const userExisted = await UserModel.findOne({ email: email });
    if (userExisted) {
        throw new ApolloError('The email address is already used.', 'BAD_USER_INPUT', {
            field: 'email'
        });
    }

    if (!password) {
        throw new ApolloError('Password is required.', 'BAD_USER_INPUT', {
            field: 'password'
        });
    }

    if (!role || !validator.isIn(role.toUpperCase(), validRoles)) {
        throw new ApolloError(`Role must be one of: ${validRoles.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'role'
        });
    }

    if (profile_picture && !validator.isURL(profile_picture)) {
        throw new ApolloError('Profile picture must be a valid URL.', 'BAD_USER_INPUT', {
            field: 'profile_picture'
        });
    }

    if (!user_status || !validator.isIn(user_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`User status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'user_status'
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const createdByUserId = '6846e5769e5502fce150eb67';

        const userData = {
            first_name: first_name,
            last_name: last_name,
            email: email,
            password: hashedPassword,
            role: role.toUpperCase(),
            profile_picture: profile_picture,
            user_status: user_status.toUpperCase(),
            created_by: createdByUserId,
            updated_by: createdByUserId
        }

        return await UserModel.create(userData);
    } catch (error) {
        throw new ApolloError('Failed to create user:', 'USER_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * Updates an existing user's information.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The unique identifier of the user to update.
 * @param {object} args.input - The new data to update for the user.
 * @returns {Promise<object>} - A promise that resolves to the updated user object.
 */
async function UpdateUser(_, { id, input }) {
    const {
        first_name,
        last_name,
        email,
        role,
        profile_picture,
        user_status
    } = input;

    const validRoles = ['ADMIN', 'USER'];
    const validStatus = ['ACTIVE', 'INACTIVE'];

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    if (!first_name || validator.isEmpty(first_name, { ignore_whitespace: true })) {
        throw new ApolloError('First name is required.', 'BAD_USER_INPUT', {
            field: 'first_name'
        });
    }

    if (!last_name || validator.isEmpty(last_name, { ignore_whitespace: true })) {
        throw new ApolloError('Last name is required.', 'BAD_USER_INPUT', {
            field: 'last_name'
        });
    }

    if (!email || !validator.isEmail(email)) {
        throw new ApolloError('A valid email address is required.', 'BAD_USER_INPUT', {
            field: 'email'
        });
    }

    const userExisted = await UserModel.findOne({ email: email });
    if (userExisted.id ==! id) {
        throw new ApolloError('The email address is already used.', 'BAD_USER_INPUT', {
            field: 'email'
        });
    }

    if (!role || !validator.isIn(role.toUpperCase(), validRoles)) {
        throw new ApolloError(`Role must be one of: ${validRoles.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'role'
        });
    }

    if (profile_picture && !validator.isURL(profile_picture)) {
        throw new ApolloError('Profile picture must be a valid URL.', 'BAD_USER_INPUT', {
            field: 'profile_picture'
        });
    }

    if (!user_status || !validator.isIn(user_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`User status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'user_status'
        });
    }

    try {
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const updatedByUserId = '6846e5769e5502fce150eb67';

        const userData = {
            first_name: first_name,
            last_name: last_name,
            email: email,
            role: role.toUpperCase(),
            profile_picture: profile_picture,
            user_status: user_status.toUpperCase(),
            updated_by: updatedByUserId
        }

        const updatedUser = await UserModel.findOneAndUpdate({ _id: id }, userData, { new: true });

        return updatedUser;
    } catch (error) {
        throw new ApolloError('Failed to update user:', 'USER_UPDATE_FAILED', {
            error: error.message
        });
    }
}

/**
 * Deletes a user by changing their status to 'DELETED'.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The unique identifier of the user to delete.
 * @returns {Promise<object>} - A promise that resolves to the user object with a 'DELETED' status.
 */
async function DeleteUser(_, { id }) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    try {
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const deletedByUserId = '6846e5769e5502fce150eb67';

        const userData = {
            user_status: 'DELETED',
            deleted_by: deletedByUserId,
            deleted_at: Date.now()
        }
        return await UserModel.findOneAndUpdate({ _id: id }, userData)
    } catch (error) {
        throw new ApolloError('Failed to delete user:', 'USER_DELETION_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER *************** 
/**
 * Loads the user who created the record using a DataLoader.
 * @param {object} parent - The parent user object.
 * @param {string} parent.created_by - The ID of the user to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(parent, _, context) {
    try {
    return await context.dataLoaders.UserLoader.load(parent.created_by);
  } catch (error) {
    throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
  }
}

/**
 * Loads the user who last updated the record using a DataLoader.
 * @param {object} parent - The parent user object.
 * @param {string} parent.updated_by - The ID of the user to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(parent, _, context) {
    try {
    return await context.dataLoaders.UserLoader.load(parent.updated_by);
  } catch (error) {
    throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {
        GetAllUsers,
        GetOneUser
    },

    Mutation: {
        CreateUser,
        UpdateUser,
        DeleteUser
    },

    User: {
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader
    }
};