// *************** IMPORT LIBRARY ***************
const bcrypt = require('bcrypt');

// *************** IMPORT MODULE *************** 
const UserModel = require('./user.model');

// *************** IMPORT UTILITIES *************** 
const { SoftDelete } = require('../../shared/utils/database.utils');

// *************** IMPORT VALIDATOR ***************
const { IsValidObjectId } = require('../../shared/validator/object_id');
const { IsEmailValid, IsEmailUnique } = require('../../shared/validator/email');

// *************** QUERY ***************
/**
 * Fetches a list of all active users.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of user objects.
 * If no users are found, returns an empty array.
 * @throws {Error} If fetching users fails.
 */
async function GetAllUsers() {
    try {
        const users = await UserModel.find({
            deleted_at: null
        });

        if (!users.length) {
            return [];
        }

        return users;
    } catch (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
    }
}

/**
 * Fetch a single user by ID, excluding soft-deleted users.
 * @param {any} _ - The unused parent/root argument from GraphQL resolvers.
 * @param {{ id: string }} args - An object containing the user's ID.
 * @param {string} args.id - The ID of the user to retrieve.
 * @returns {Promise<Object>} A promise that resolves to the user object if found and not deleted.
 * @throws {Error} If the ID is invalid, the user is not found, or a database error occurs.
 */
async function GetOneUser(_, { id }) {
    if (!IsValidObjectId(id)) {
        throw new Error(`Invalid ID: ${id}`);
    }
    try {
        const user = await UserModel.findById({
            _id: id,
            deleted_at: null
        });
        if (!user || user.deleted_at) {
            throw new Error('User not found');
        }
        return user;
    } catch (error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
    }
}

// *************** MUTATION ***************
/**
 * Create a new user.
 * Validates the email format, ensures email uniqueness, hashes the password,
 * and stores the user data in the database.
 * @param {any} _ - The unused parent/root argument from GraphQL resolvers.
 * @param {{ input: { 
 *   first_name: string, 
 *   last_name: string, 
 *   email: string, 
 *   password: string, 
 *   role: string 
 * }}} args - The input object containing user data.
 * @returns {Promise<void>} A promise that resolves when the user is successfully created.
 * @throws {Error} If the email is invalid, not unique, required fields are missing,
 * or if any other error occurs during creation.
 */
async function CreateUser(_, { input }) {
    const { first_name, last_name, email, password, role } = input;
    if (!IsEmailValid(email)) {
        throw new Error(`Invalid email format: ${email}`);
    }
    try {
        const isEmailUnique = await IsEmailUnique(email, UserModel);
        if (!isEmailUnique) {
            throw new Error(`The email address '${email}' is already taken`);
        }

        if (first_name === undefined ||
            last_name === undefined ||
            email === undefined ||
            password === undefined ||
            role === undefined) {
            throw new Error('All fields (first_name, last_name, email, password, role) are required.');
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = {
            first_name,
            last_name,
            email,
            password: hashedPassword,
            role
        };

        return await UserModel.create(user);
    } catch (error) {
        if (error.message.includes("is already taken") || error.message.includes("Invalid email format")) {
            throw error;
        }
        console.error(`CreateUser Resolver Error for email ${input.email}:`, error);
        throw new Error(`Failed to create user: ${error.message}`);
    }
}

/**
 * Updates a user's information in the database.
 * Validates the provided ID and email format (if email is being updated).
 * Ensures email uniqueness if a new email is provided.
 * Hashes the password if a new password is provided.
 * Stores the updated user data.
 * @async
 * @function UpdateUser
 * @param {object} _ - The unused parent/root argument, typical in GraphQL resolvers.
 * * @param {{ id: string }} args - An object containing the user's ID.
 * @param {{ input: { 
 *   first_name: string, 
 *   last_name: string, 
 *   email: string, 
 *   password: string, 
 *   role: string 
 * }}} args - The input object containing user data.
 * @returns {Promise<object>} A promise that resolves to the updated user object.
 * @throws {Error} If the ID is invalid, email format is invalid (for new email),
 * email address is already taken (for new email), or if any other unexpected server error occurs.
 */
async function UpdateUser(_, { id, input }) {
    const { first_name, last_name, email, password, role } = input;

    if (!IsValidObjectId(id)) {
        throw new Error(`Invalid ID: ${id}`);
    }

    if (email && !IsEmailValid(email)) {
        throw new Error(`Invalid email format: ${email}`);
    }
    try {
        if (email) {
            const isEmailUnique = await IsEmailUnique(email, UserModel);
            if (!isEmailUnique) {
                throw new Error(`The email address '${email}' is already taken`);
            }
        }

        const update = {}
        if (first_name !== undefined) update.first_name = first_name;
        if (last_name !== undefined) update.last_name = last_name;
        if (email !== undefined) update.email = email;
        if (role !== undefined) update.role = role;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            update.password = hashedPassword;
        }

        return await UserModel.findByIdAndUpdate(id, update, { new: true });
    } catch (error) {
        if (
            error.message.includes("is already taken") ||
            error.message.includes("Invalid email format") ||
            error.message.includes("Invalid ID")
        ) {
            throw error;
        }
        console.error(`UpdateUser Resolver Error for ID ${id}:`, error);
        throw new Error(`An unexpected server error occurred. Please try again later. ${error}`);
    }
}

/**
 * Finds a user by ID via `UserModel` and soft deletes them using the `SoftDelete` utility
 * if the user exists and is not already soft-deleted.
 * @async
* @param {{ id: string }} args - An object containing the user's ID.
 * @returns {Promise<object>} A promise that resolves to the soft-deleted user document.
 * @throws {Error} Throws an error with message "User not found" if the user does not exist
 * or is already soft-deleted.
 */
async function DeleteUser(_, { id }) {
    if (!IsValidObjectId(id)) {
        throw new Error(`Invalid ID: ${id}`);
    }

    try {
        const user = await UserModel.findById(id);
        if (!user || user.deleted_at) {
            throw new Error('User not found');
        }

        return await SoftDelete(user);
    } catch (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
    }
}

const userResolvers = {
    Query: {
        GetAllUsers,
        GetOneUser
    },

    Mutation: {
        CreateUser,
        UpdateUser,
        DeleteUser
    }
};

// *************** EXPORT MODULE ***************
module.exports = userResolvers;