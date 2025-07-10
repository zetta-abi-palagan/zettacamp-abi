// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const bcrypt = require('bcrypt');

// *************** IMPORT MODULE *************** 
const UserModel = require('./user.model');
const StudentModel = require('../student/student.model');

// *************** IMPORT UTILITIES ***************
const { GenerateToken } = require('../../middleware/auth');

// *************** IMPORT HELPER FUNCTION *************** 
const UserHelper = require('./user.helper');

// *************** IMPORT VALIDATOR ***************
const UserValidator = require('./user.validator');
const CommonValidator = require('../../shared/validator/index');

// *************** QUERY ***************
/**
 * GraphQL resolver to fetch a paginated, sorted, and filtered list of users using an aggregation pipeline.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {object} [args.filter] - Optional. An object containing fields to filter the user list.
 * @param {object} [args.sort] - Optional. An object specifying the sorting field and order ('ASC' or 'DESC').
 * @param {number} [args.page=1] - Optional. The page number for pagination.
 * @param {number} [args.limit=10] - Optional. The number of users per page.
 * @returns {Promise<object>} - A promise that resolves to an object containing the paginated 'data' and the total 'countDocuments'.
 */
async function GetAllUsers(_, { filter, sort, page = 1, limit = 10 }) {
    try {
        const pipeline = [];
        const matchStage = {};

        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'created_by',
                foreignField: '_id',
                as: 'creatorInfo'
            }
        });
        pipeline.push({ $unwind: { path: "$creatorInfo", preserveNullAndEmptyArrays: true } });

        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'updated_by',
                foreignField: '_id',
                as: 'updaterInfo'
            }
        });
        pipeline.push({ $unwind: { path: "$updaterInfo", preserveNullAndEmptyArrays: true } });

        if (filter) {
            if (filter.first_name) matchStage.first_name = { $regex: filter.first_name, $options: 'i' };
            if (filter.last_name) matchStage.last_name = { $regex: filter.last_name, $options: 'i' };
            if (filter.email) matchStage.email = { $regex: filter.email, $options: 'i' };
            if (filter.role) matchStage.role = filter.role;
            if (filter.user_status) matchStage.user_status = filter.user_status;

            if (filter.created_by) {
                if (filter.created_by.first_name) matchStage['creatorInfo.first_name'] = { $regex: filter.created_by.first_name, $options: 'i' };
                if (filter.created_by.last_name) matchStage['creatorInfo.last_name'] = { $regex: filter.created_by.last_name, $options: 'i' };
                if (filter.created_by.email) matchStage['creatorInfo.email'] = { $regex: filter.created_by.email, $options: 'i' };
                if (filter.created_by.role) matchStage['creatorInfo.role'] = filter.created_by.role;
            }

            if (filter.updated_by) {
                if (filter.updated_by.first_name) matchStage['updaterInfo.first_name'] = { $regex: filter.updated_by.first_name, $options: 'i' };
                if (filter.updated_by.last_name) matchStage['updaterInfo.last_name'] = { $regex: filter.updated_by.last_name, $options: 'i' };
                if (filter.updated_by.email) matchStage['updaterInfo.email'] = { $regex: filter.updated_by.email, $options: 'i' };
                if (filter.updated_by.role) matchStage['updaterInfo.role'] = filter.updated_by.role;
            }
        }

        if (!filter || !filter.user_status) {
            matchStage.user_status = { $ne: 'DELETED' };
        }

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        const sortStage = {};
        if (sort && sort.field && sort.order) {
            const sortOrder = sort.order === 'DESC' ? -1 : 1;
            if (sort.field.startsWith('created_by.')) {
                sortStage[`creatorInfo.${sort.field.split('.')[1]}`] = sortOrder;
            } else if (sort.field.startsWith('updated_by.')) {
                sortStage[`updaterInfo.${sort.field.split('.')[1]}`] = sortOrder;
            } else {
                sortStage[sort.field] = sortOrder;
            }
        } else {
            sortStage.created_at = -1;
        }
        pipeline.push({ $sort: sortStage });

        pipeline.push({
            $facet: {
                data: [
                    { $skip: (page - 1) * limit },
                    { $limit: limit }
                ],
                countDocuments: [
                    { $count: 'count' }
                ]
            }
        });

        const results = await UserModel.aggregate(pipeline);

        return {
            data: results[0].data,
            countDocuments: results[0].countDocuments.length > 0 ? results[0].countDocuments[0].count : 0,
        };
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

        CommonValidator.ValidateObjectId(id);
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

/**
 * GraphQL resolver to handle user and student login.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {object} args.loginInput - An object containing the user's email and password.
 * @returns {Promise<object>} - A promise that resolves to an object containing the JWT and user data.
 */
async function Login(_, { loginInput }) {
    try {
        CommonValidator.ValidateInputTypeObject(loginInput);
        UserValidator.ValidateLoginInput(loginInput);

        let account = await UserModel.findOne({ email: loginInput.email }).lean();
        let accountType = 'user';

        if (!account) {
            account = await StudentModel.findOne({ email: loginInput.email }).lean();
            accountType = 'student';
        }

        if (!account) {
            throw new ApolloError('User not found', 'ACCOUNT_NOT_FOUND');
        }

        const isMatch = await bcrypt.compare(loginInput.password, account.password);
        if (!isMatch) {
            throw new ApolloError('Invalid credentials', 'INVALID_CREDENTIALS');
        }

        const userForToken = {
            _id: account._id,
            role: accountType === 'student' ? 'STUDENT' : account.role
        };

        const token = GenerateToken(userForToken);

        const { password, ...userWithoutPassword } = account;

        return {
            token,
            user: {
                ...userWithoutPassword,
                role: userForToken.role
            }
        }
    } catch (error) {
        console.error('Unexpected error in Login:', error);

        throw new ApolloError('Failed to login:', 'LOGIN_FAILED', {
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
        DeleteUser,
        Login
    },

    User: {
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader
    }
};