// *************** IMPORT MODULE *************** 
const userModel = require('./user.model');

// *************** IMPORT HELPER FUNCTION ***************
const {
    GetAllUsers,
    GetOneUser,
    CreateUser,
    UpdateUser,
    DeleteUser,
} = require('./user.helper');

// *************** IMPORT VALIDATOR ***************
const { IsValidObjectId } = require('../../shared/validator/object_id');
const { IsEmailValid, IsEmailUnique } = require('../../shared/validator/email');

const userResolvers = {
    // *************** QUERY ***************
    Query: {
        /**
         * Retrieves all users.
         * @async
         * @returns {Promise<UserDocument[]>} A promise that resolves to an array of user documents.
         * @throws {Error} If the underlying service call (`GetAllUsers`) fails.
         */
        GetAllUsers: async () => {
            return await GetAllUsers(); // Assumes GetAllUsers service exists
        },

        /**
         * Retrieves a single user by their ID.
         * @async
         * @param {any} _ - The parent object, typically unused in root queries.
         * @param {{ id: string | ObjectId }} args - The arguments containing the user's ID.
         * @returns {Promise<UserDocument|null>} A promise that resolves to the user document or null if not found.
         * @throws {Error} "Invalid ID: [id]" if the provided ID is not a valid ObjectId.
         * Throws an error if the underlying service call (`GetOneUser`) fails.
         */
        GetOneUser: async (_, { id }) => {
            if (!IsValidObjectId(id)) { // Assumes IsValidObjectId service exists
                throw new Error(`Invalid ID: ${id}`);
            }
            return await GetOneUser(id); // Assumes GetOneUser service exists
        }
    },

    // *************** MUTATION ***************
    Mutation: {
        /**
         * Creates a new user with the provided input data.
         * Validates email format and uniqueness before creation.
         * @async
         * @param {any} _ - The parent object, typically unused.
         * @param {{ input: { email: string, [key: string]: any } }} args - The arguments containing the user input data.
         * @returns {Promise<UserDocument>} A promise that resolves to the newly created user document.
         * @throws {Error} "Invalid email format: [email]" if the email format is invalid.
         * @throws {Error} "The email address '[email]' is already taken" if the email is not unique.
         * @throws {Error} "An unexpected server error occurred..." for other failures during creation.
         */
        CreateUser: async (_, { input }) => {
            const email = input.email;

            if (!IsEmailValid(email)) { // Assumes IsEmailValid service exists
                throw new Error(`Invalid email format: ${email}`);
            }

            try {
                // Assumes IsEmailUnique service exists and userModel is in scope
                const isEmailUnique = await IsEmailUnique(email, userModel);
                if (!isEmailUnique) {
                    throw new Error(`The email address '${email}' is already taken`);
                }
                // Assumes CreateUser service exists
                return await CreateUser(input);
            } catch (error) {
                if (error.message.includes("is already taken") || error.message.includes("Invalid email format")) {
                    throw error;
                }
                console.error(`CreateUser Resolver Error for email ${input.email}:`, error);
                throw new Error('An unexpected server error occurred. Please try again later.');
            }
        },

        /**
         * Updates an existing user identified by ID with the provided input data.
         * Validates ID format. If email is provided in input, validates its format and uniqueness.
         * @async
         * @param {any} _ - The parent object, typically unused.
         * @param {{ id: string | ObjectId, input: { email?: string, [key: string]: any } }} args - The arguments containing the user's ID and update data.
         * @returns {Promise<UserDocument|null>} A promise that resolves to the updated user document or null if not found.
         * @throws {Error} "Invalid ID: [id]" if the provided ID is not valid.
         * @throws {Error} "Invalid email format: [email]" if the provided email format is invalid.
         * @throws {Error} "The email address '[email]' is already taken" if the email is not unique.
         * (Note: `IsEmailUnique` might need adjustment to exclude the current user when checking email for an update).
         * @throws {Error} "An unexpected server error occurred..." for other failures during update.
         */
        UpdateUser: async (_, { id, input }) => {
            const email = input.email;

            if (!IsValidObjectId(id)) { // Assumes IsValidObjectId service exists
                throw new Error(`Invalid ID: ${id}`);
            }

            if (email && !IsEmailValid(email)) { // Assumes IsEmailValid service exists
                throw new Error(`Invalid email format: ${email}`);
            }

            try {
                if (email) {
                    // Assumes IsEmailUnique service exists and userModel is in scope
                    // For updates, IsEmailUnique ideally should allow the user's current email
                    // or exclude the current user's ID from the uniqueness check.
                    const isEmailUnique = await IsEmailUnique(email, userModel);
                    if (!isEmailUnique) {
                        throw new Error(`The email address '${email}' is already taken`);
                    }
                }
                // Assumes UpdateUser service exists
                return await UpdateUser(id, input);
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
        },

        /**
         * Deletes a user by their ID. (Likely a soft delete).
         * Validates the ID format.
         * @async
         * @param {any} _ - The parent object, typically unused.
         * @param {{ id: string | ObjectId }} args - The arguments containing the user's ID.
         * @returns {Promise<UserDocument|null>} A promise that resolves to the (soft) deleted user document or null if not found/already deleted by the service.
         * @throws {Error} "Invalid ID: [id]" if the provided ID is not valid.
         * Throws an error if the underlying service call (`DeleteUser`) fails (e.g., user not found by service).
         */
        DeleteUser: async (_, { id }) => {
            if (!IsValidObjectId(id)) { // Assumes IsValidObjectId service exists
                throw new Error(`Invalid ID: ${id}`);
            }
            // Assumes DeleteUser service exists and handles "not found" or "already deleted" cases.
            return await DeleteUser(id);
        }
    }
};

// *************** EXPORT MODULE ***************
module.exports = userResolvers;