// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const UserModel = require('./user.model');

/**
 * Creates a new DataLoader for batch-loading user data.
 * This function is used to solve the N+1 problem by collecting individual user ID requests
 * and fetching them in a single database query.
 * @returns {DataLoader} - An instance of DataLoader for fetching users by ID.
 */
function UserLoader() {
  return new DataLoader(async (userIds) => {
    try {
      const users = await UserModel.find({
        _id: { $in: userIds },
      });

      const usersById = new Map(users.map((user) => [String(user._id), user]));

      return userIds.map((userId) => usersById.get(String(userId)));
    } catch (error) {
      console.error('Error batch fetching users:', error);
      throw new ApolloError(`Failed to batch fetch users: ${error.message}`, 'USER_BATCH_FETCH_FAILED');
    }
  });
}

// *************** EXPORT MODULE ***************
module.exports = UserLoader;
