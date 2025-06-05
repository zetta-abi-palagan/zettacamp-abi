// *************** IMPORT LIBRARY ***************
const bcrypt = require('bcrypt');

// *************** IMPORT MODULE ***************
const userModel = require('./user.model');

// *************** IMPORT UTILITIES ***************
const { SoftDelete } = require('../../shared/utils/database.utils');

/**
 * Fetches a list of all active users.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of user objects.
 * @throws {Error} If fetching users fails.
 */
async function GetAllUsers() {
    try {
        return await userModel.find({
            deleted_at: null
        });
    } catch (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
    }
}

/**
 * Fetches a single user by their ID.
 * @param {string} id - The ID of the user to fetch.
 * @returns {Promise<Object>} A promise that resolves to the user object.
 * @throws {Error} If the user is not found or fetching fails.
 */
async function GetOneUser(id) {
    try {
        const user = await userModel.findById({
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

/**
 * Creates a new user in the database.
 * @async
 * @param {object} input - The user input object.
 * @param {string} input.first_name - The first name of the user.
 * @param {string} input.last_name - The last name of the user.
 * @param {string} input.email - The email address of the user. This must be unique.
 * @param {string} input.password - The plain text password of the user. This will be hashed before saving.
 * @param {string} input.role - The role of the user.
 * @returns {Promise<object>} A promise that resolves to the saved user object.
 * @throws {Error} Throws an error if the email already exists or if there's a failure during user creation.
 */
async function CreateUser(input) {
    try {
        const { first_name, last_name, email, password, role } = input;
        if (first_name === undefined ||
            last_name === undefined ||
            email === undefined ||
            password === undefined ||
            role === undefined) {
            throw new Error('All fields (first_name, last_name, email, password, role) are required.');
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = new userModel({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            role
        });
        return await user.save();
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Email already exists. Please use different email.');
        }
        throw new Error(`Failed to create user: ${error.message}`);
    }
}

/**
 * Updates an existing user's information in the database.
 * All fields in the input object are optional.
 *
 * @async
 * @function UpdateUser
 * @param {string} id - The ID of the user to update.
 * @param {object} input - The user input object containing fields to update.
 * @param {string} [input.first_name] - The new first name of the user (optional).
 * @param {string} [input.last_name] - The new last name of the user (optional).
 * @param {string} [input.email] - The new email address of the user (optional). If provided, it must be unique.
 * @param {string} [input.password] - The new plain text password of the user (optional). This will be hashed before saving.
 * @param {string} [input.role] - The new role of the user (optional).
 * @returns {Promise<object>} A promise that resolves to the updated user object.
 * @throws {Error} Throws an error if the user is not found, if the email already exists (when email is being updated), or if there's any other failure during the user update process.
 */
async function UpdateUser(id, input) {
    try {
        const user = await userModel.findById(id);
        if (!user || user.deleted_at) {
            throw new Error('User not found');
        }

        const { first_name, last_name, email, password, role } = input;
        if (first_name !== undefined) user.first_name = first_name;
        if (last_name !== undefined) user.last_name = last_name;
        if (email !== undefined) user.email = email;
        if (role !== undefined) user.role = role;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }

        return await user.save();
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Email already exists. Please use different email.');
        }
        throw new Error(`Failed to update user: ${error.message}`);
    }
}

/**
 * Finds a user by ID via `userModel` and soft deletes them using the `SoftDelete` utility
 * if the user exists and is not already soft-deleted.
 * @async
 * @param {string} id - The ID of the user to be soft-deleted.
 * @returns {Promise<object>} A promise that resolves to the soft-deleted user document.
 * @throws {Error} Throws an error with message "User not found" if the user does not exist
 * or is already soft-deleted.
 */
async function DeleteUser(id) {
    try {
        const user = await userModel.findById(id);
        if (!user || user.deleted_at) {
            throw new Error('User not found');
        }

        return await SoftDelete();
    } catch (error) {
        throw new Error(`Failed to delete user: ${error.message}`);
    }
}

// *************** EXPORT MODULE *************** 
module.exports = {
    GetAllUsers,
    GetOneUser,
    CreateUser,
    UpdateUser,
    DeleteUser
}