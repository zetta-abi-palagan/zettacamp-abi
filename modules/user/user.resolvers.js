// *************** IMPORT HELPER FUNCTION *************** 
const {
    GetAllUsers,
    GetOneUser,
    CreateUser,
    UpdateUser,
    DeleteUser
} = require('./user.helper');

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