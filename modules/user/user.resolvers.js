// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const UserModel = require('./user.model');

// *************** IMPORT HELPER FUNCTION *************** 
const UserHelper = require('./user.helper');

// *************** IMPORT VALIDATOR ***************
const UserValidator = require('./user.validator');
const CommonValidator = require('../../shared/validator/index');

// *************** QUERY ***************
/**
 * Fetches all non-deleted users from the database.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of user objects.
 */
async function GetAllUsers() {
    try {
        const users = await UserModel.find({ user_status: { $ne: 'DELETED' } }).lean();

        return users;
    } catch (error) {
        console.error('Unexpected error in GetAllUsers:', error);

        throw new ApolloError(`Failed to fetch users: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * GraphQL resolver to fetch a single user by their unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} args.id - The unique identifier of the user to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found user object.
 */
async function GetOneUser(_, { id }) {
    try {
        CommonValidator.ValidateObjectId(id)

        const user = await UserModel.findById(id).lean();
        if (!user) {
            throw new ApolloError("User not found", "NOT_FOUND");
        }

        return user;
    } catch (error) {
        console.error('Unexpected error in GetOneUser:', error);

        throw new ApolloError(`Failed to fetch user: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

// *************** MUTATION ***************
/**
 * GraphQL resolver to create a new user.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {object} args.createUserInput - An object containing the details for the new user.
 * @param {object} context - The GraphQL context, used here to get the authenticated user's ID.
 * @returns {Promise<object>} - A promise that resolves to the newly created user object.
 */
async function CreateUser(_, { createUserInput }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateInputTypeObject(createUserInput);

        const emailExists = await UserModel.exists({ email: createUserInput.email });

        UserValidator.ValidateUserInput({ userInput: createUserInput, isEmailUnique: !emailExists });

        const createUserPayload = await UserHelper.GetCreateUserPayload({ createUserInput, userId, isEmailUnique: !emailExists });

        const newUser = await UserModel.create(createUserPayload);
        if (!newUser) {
            throw new ApolloError('Failed to create user', 'USER_CREATION_FAILED');
        }

        return newUser;
    } catch (error) {
        console.error('Unexpected error in CreateUser:', error);

        throw new ApolloError('Failed to create user:', 'USER_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to update an existing user with partial data.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the user to update.
 * @param {object} args.updateUserInput - An object containing the fields to be updated.
 * @param {object} context - The GraphQL context, used here to get the authenticated user's ID.
 * @returns {Promise<object>} - A promise that resolves to the updated user object.
 */
async function UpdateUser(_, { id, updateUserInput }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateInputTypeObject(updateUserInput);

        let isEmailUnique = true;
        if (updateUserInput.email) {
            const emailExists = await UserModel.exists({ email: updateUserInput.email, _id: { $ne: id } });
            isEmailUnique = !emailExists;
        }

        UserValidator.ValidateUserInput({ userInput: updateUserInput, isEmailUnique, isUpdate: true });

        const updateUserPayload = await UserHelper.GetUpdateUserPayload({ updateUserInput, userId, isEmailUnique });

        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: id },
            { $set: updateUserPayload },
            { new: true }
        ).lean();

        if (!updatedUser) {
            throw new ApolloError('User not found or update failed', 'USER_UPDATE_FAILED');
        }

        return updatedUser;
    } catch (error) {
        console.error('Unexpected error in UpdateUser:', error);

        throw new ApolloError('Failed to update user:', 'USER_UPDATE_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to soft-delete a user.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the user to delete.
 * @param {object} context - The GraphQL context, used here to get the authenticated user's ID.
 * @returns {Promise<object>} - A promise that resolves to the user object as it was before being soft-deleted.
 */
async function DeleteUser(_, { id }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateObjectId(id);

        const { user } = await UserHelper.GetDeleteUserPayload({ userId: id, deletedBy: userId });

        const deletedUser = await UserModel.findOneAndUpdate(
            user.filter,
            user.update
        ).lean();

        if (!deletedUser) {
            throw new ApolloError('User not found or deletion failed', 'USER_DELETION_FAILED');
        }

        return deletedUser;
    } catch (error) {
        console.error('Unexpected error in DeleteUser:', error);

        throw new ApolloError('Failed to delete user:', 'USER_DELETION_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER *************** 
/**
 * Loads the user who created the user using a DataLoader.
 * @param {object} user - The parent user object.
 * @param {string} user.created_by - The ID of the user who created the user.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(user, _, context) {
    try {
        UserValidator.ValidateUserLoaderInput(user, context, 'created_by');

        const createdBy = await context.dataLoaders.UserLoader.load(user.created_by);

        return createdBy;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who last updated the user using a DataLoader.
 * @param {object} user - The parent user object.
 * @param {string} user.updated_by - The ID of the user who last updated the user.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(user, _, context) {
    try {
        UserValidator.ValidateUserLoaderInput(user, context, 'updated_by');

        const updatedBy = await context.dataLoaders.UserLoader.load(user.updated_by);

        return updatedBy;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED', {
            error: error.message
        });
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