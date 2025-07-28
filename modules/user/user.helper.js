// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const bcrypt = require('bcrypt');

// *************** IMPORT MODULE ***************
const config = require('../../core/config');
const UserModel = require('./user.model');

// *************** IMPORT UTILITES ***************
const CommonHelper = require('../../shared/helper/index');

// *************** IMPORT VALIDATOR ***************
const UserValidator = require('./user.validator');
const CommonValidator = require('../../shared/validator/index');

/**
 * Processes and transforms raw user input into a structured data payload for a create operation, including password hashing.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.createUserInput - The raw input object containing the new user's properties.
 * @param {string} args.userId - The ID of the user creating the record.
 * @param {boolean} args.isEmailUnique - A flag indicating if the provided email is unique.
 * @returns {Promise<object>} A promise that resolves to a processed data payload suitable for a database create operation.
 */
async function GetCreateUserPayload({ createUserInput, userId, isEmailUnique }) {
  CommonValidator.ValidateInputTypeObject(createUserInput);
  CommonValidator.ValidateObjectId(userId);
  UserValidator.ValidateUserInput({ userInput: createUserInput, isEmailUnique });

  const { first_name, last_name, email, password, role, profile_picture, user_status } = createUserInput;

  const hashedPassword = await bcrypt.hash(password, parseInt(config.BCRYPT_ROUNDS));

  return {
    first_name,
    last_name,
    email,
    password: hashedPassword,
    role: role.toUpperCase(),
    profile_picture,
    user_status: user_status.toUpperCase(),
    created_by: userId,
    updated_by: userId,
  };
}

/**
 * Processes and transforms raw user input into a structured data payload for a partial update operation.
 * It only includes fields that are explicitly provided and hashes the password if a new one is supplied.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.updateUserInput - The raw input object containing the user's properties to update.
 * @param {string} args.userId - The ID of the user performing the update.
 * @param {boolean} args.isEmailUnique - A flag indicating if the provided email is unique.
 * @returns {Promise<object>} A promise that resolves to a processed data payload suitable for a partial database update.
 */
async function GetUpdateUserPayload({ updateUserInput, userId, isEmailUnique }) {
  CommonValidator.ValidateInputTypeObject(updateUserInput);
  CommonValidator.ValidateObjectId(userId);
  UserValidator.ValidateUserInput({ userInput: updateUserInput, isEmailUnique, isUpdate: true });

  const { first_name, last_name, email, password, role, profile_picture, user_status } = updateUserInput;

  const payload = {};

  if (first_name !== undefined && first_name !== null) payload.first_name = first_name;
  if (last_name !== undefined && last_name !== null) payload.last_name = last_name;
  if (email !== undefined && email !== null) payload.email = email;
  if (password !== undefined && password !== null) payload.password = await bcrypt.hash(password, parseInt(config.BCRYPT_ROUNDS));
  if (role !== undefined && role !== null) payload.role = role.toUpperCase();
  if (profile_picture !== undefined && profile_picture !== null) payload.profile_picture = profile_picture;
  if (user_status !== undefined && user_status !== null) payload.user_status = user_status.toUpperCase();

  payload.updated_by = userId;

  return payload;
}

/**
 * Generates a payload for soft-deleting a user.
 * @param {object} args - The arguments for getting the delete payload.
 * @param {string} args.userId - The unique identifier of the user to be deleted.
 * @param {string} args.deletedBy - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for the delete operation.
 */
async function GetDeleteUserPayload({ userId, deletedBy }) {
  try {
    CommonValidator.ValidateObjectId(userId);
    CommonValidator.ValidateObjectId(deletedBy);

    const deletionTimestamp = Date.now();

    const user = await UserModel.findOne({ _id: userId, user_status: { $ne: 'DELETED' } });
    if (!user) {
      throw new ApolloError('User not found', 'USER_NOT_FOUND');
    }

    const deleteUserPayload = {
      user: CommonHelper.BuildDeletePayload({
        ids: [userId],
        statusKey: 'user_status',
        timestamp: deletionTimestamp,
        userId: deletedBy,
      }),
    };

    return deleteUserPayload;
  } catch (error) {
    throw new ApolloError(`Failed in GetDeleteUserPayload: ${error.message}`, 'DELETE_USER_PAYLOAD_FAILED', {
      error: error.message,
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
  GetCreateUserPayload,
  GetUpdateUserPayload,
  GetDeleteUserPayload,
};
