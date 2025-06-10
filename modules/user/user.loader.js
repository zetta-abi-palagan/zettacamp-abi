// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { keyBy } = require('lodash');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const UserModel = require('./user.model');

function UserLoader() {
    return new DataLoader(async function (userIds) {
        try {
            const users = await UserModel.find({
                _id: { $in: userIds },
            });

            const usersById = keyBy(users, function(user) {
                return user._id.toString();
            });

            return userIds.map(function(userId) {
                return usersById[userId.toString()]
            });
        } catch (error) {
            console.error('Error batch fetching users:', error);
            throw new ApolloError(`Failed to batch fetch users: ${error.message}`, 'USER_BATCH_FETCH_FAILED');
        }
    });
}

// *************** EXPORT MODULE ***************
module.exports = UserLoader;