// *************** IMPORT LIBRARY ***************
const bcrypt = require('bcrypt');

// *************** IMPORT CORE ***************
const userModel = require('./user.model');

const userResolvers = {
    Query: {
        /**
         * Fetches a list of all active users.
         * @returns {Promise<Array<Object>>} A promise that resolves to an array of user objects.
         * @throws {Error} If fetching users fails.
         */
        GetAllUsers: async () => {
            try {
                return await userModel.findActive();
            } catch (error) {
                throw new Error(`Failed to fetch users: ${error.message}`);
            }
        },

        /**
         * Fetches a single user by their ID.
         * @param {Object} _ - The root object, not used in this resolver.
         * @param {Object} args - The arguments passed to the resolver.
         * @param {string} args.id - The ID of the user to fetch.
         * @returns {Promise<Object>} A promise that resolves to the user object.
         * @throws {Error} If the user is not found or fetching fails.
         */
        GetOneUser: async (_, { id }) => {
            try {
                const user = await userModel.findById(id);
                if (!user || user.deleted_at) {
                    throw new Error('User not found');
                }
                return user;
            } catch (error) {
                throw new Error(`Failed to fetch user: ${error.message}`);
            }
        },
    },

    Mutation: {
        /**
         * Creates a new user.
         * @param {Object} _ - The root object, not used in this resolver.
         * @param {Object} args - The arguments passed to the resolver.
         * @param {Object} args.input - The input object for creating a user.
         * @param {string} args.input.password - The plain text password for the user.
         * @returns {Promise<Object>} A promise that resolves to the newly created user object.
         * @throws {Error} If the email already exists or user creation fails.
         */
        CreateUser: async (_, { input }) => {
            try {
                const hashedPassword = await bcrypt.hash(input.password, 10)

                const user = new userModel({ ...input, password: hashedPassword });
                return await user.save();
            } catch (error) {
                if (error.code === 11000) {
                    throw new Error('Email already exists');
                }
                throw new Error(`Failed to create user: ${error.message}`);
            }
        },

        /**
         * Updates an existing user.
         * @param {Object} _ - The root object, not used in this resolver.
         * @param {Object} args - The arguments passed to the resolver.
         * @param {string} args.id - The ID of the user to update.
         * @param {Object} args.input - The input object with fields to update.
         * @returns {Promise<Object>} A promise that resolves to the updated user object.
         * @throws {Error} If the user is not found, email already exists, or update fails.
         */
        UpdateUser: async (_, { id, input }) => {
            try {
                const user = await userModel.findById(id);
                if (!user || user.deleted_at) {
                    throw new Error('User not found');
                }

                Object.assign(user, input);
                return await user.save();
            } catch (error) {
                if (error.code === 11000) {
                    throw new Error('Email already exists');
                }
                throw new Error(`Failed to update user: ${error.message}`);
            }
        },

        /**
         * Soft deletes a user by their ID.
         * @param {Object} _ - The root object, not used in this resolver.
         * @param {Object} args - The arguments passed to the resolver.
         * @param {string} args.id - The ID of the user to delete.
         * @returns {Promise<Object>} A promise that resolves to the soft-deleted user object.
         * @throws {Error} If the user is not found or deletion fails.
         */
        DeleteUser: async (_, { id }) => {
            try {
                const user = await userModel.findById(id);
                if (!user || user.deleted_at) {
                    throw new Error('User not found');
                }

                return await user.softDelete();
            } catch (error) {
                throw new Error(`Failed to delete user: ${error.message}`);
            }
        }
    }
};

// *************** EXPORT MODULE ***************
module.exports = userResolvers;