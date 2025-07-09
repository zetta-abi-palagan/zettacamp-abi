// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const SchoolModel = require('./school.model');
const StudentModel = require('../student/student.model');

// *************** IMPORT HELPER FUNCTION *************** 
const SchoolHelper = require('./school.helper');

// *************** IMPORT VALIDATOR ***************
const SchoolValidator = require('./school.validator');
const CommonValidator = require('../../shared/validator/index');

// *************** QUERY ***************
/**
 * Fetches all non-deleted schools from the database.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of school objects.
 */
async function GetAllSchools() {
    try {
        const schools = await SchoolModel.find({ school_status: { $ne: 'DELETED' } }).lean();

        return schools;
    } catch (error) {
        console.error('Unexpected error in GetAllSchools:', error);

        throw new ApolloError(`Failed to fetch schools: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * GraphQL resolver to fetch a single school by its unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} args.id - The unique identifier of the school to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found school object.
 */
async function GetOneSchool(_, { id }) {
    try {
        CommonValidator.ValidateObjectId(id);

        const school = await SchoolModel.findById(id).lean();
        if (!school) {
            throw new ApolloError("School not found", "NOT_FOUND");
        }

        return school;

    } catch (error) {
        console.error('Unexpected error in GetOneSchool:', error);

        throw new ApolloError(`Failed to fetch school: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

// *************** MUTATION ***************
/**
 * GraphQL resolver to create a new school.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {object} args.createSchoolInput - An object containing the details for the new school.
 * @param {object} context - The GraphQL context, used here to get the authenticated user's ID.
 * @returns {Promise<object>} - A promise that resolves to the newly created school object.
 */
async function CreateSchool(_, { createSchoolInput }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateInputTypeObject(createSchoolInput);
        SchoolValidator.ValidateSchoolInput(createSchoolInput);

        const createSchoolPayload = SchoolHelper.GetCreateSchoolPayload(createSchoolInput, userId);

        const newSchool = await SchoolModel.create(createSchoolPayload);
        if (!newSchool) {
            throw new ApolloError('Failed to create school', 'SCHOOL_CREATION_FAILED');
        }

        return newSchool;
    } catch (error) {
        console.error('Unexpected error in CreateSchool:', error);

        throw new ApolloError('Failed to create school:', 'SCHOOL_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to update an existing school with partial data.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the school to update.
 * @param {object} args.updateSchoolInput - An object containing the fields to be updated.
 * @param {object} context - The GraphQL context, used here to get the authenticated user's ID.
 * @returns {Promise<object>} - A promise that resolves to the updated school object.
 */

async function UpdateSchool(_, { id, updateSchoolInput }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateObjectId(id);
        SchoolValidator.ValidateSchoolInput({ updateSchoolInput, isUpdate: true });

        const updateSchoolPayload = SchoolHelper.GetUpdateSchoolPayload({ updateSchoolInput, userId });

        const updatedSchool = await SchoolModel.findOneAndUpdate(
            { _id: id },
            { $set: updateSchoolPayload },
            { new: true }
        )

        if (!updatedSchool) {
            throw new ApolloError('Failed to update school', 'SCHOOL_UPDATE_FAILED');
        }

        return updatedSchool;
    } catch (error) {
        console.error('Unexpected error in UpdateSchool:', error);

        throw new ApolloError('Failed to update school:', 'SCHOOL_UPDATE_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to perform a cascading soft delete on a school and its associated students.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the school to delete.
 * @param {object} context - The GraphQL context, used here to get the authenticated user's ID.
 * @returns {Promise<object>} - A promise that resolves to the school object as it was before being soft-deleted.
 */
async function DeleteSchool(_, { id }, context) {
    try {
        const userId = (context && context.user && context.user._id);
        if (!userId) {
            throw new ApolloError('User not authenticated', 'UNAUTHENTICATED');
        }

        CommonValidator.ValidateObjectId(id);

        const { students, school } = await SchoolHelper.GetDeleteSchoolPayload({ schoolId: id, userId });

        if (students) {
            const deletedStudents = await StudentModel.updateMany(
                students.filter,
                students.update
            );
            if(!deletedStudents.nModified) {
                throw new ApolloError('No student match for deletion', 'STUDENT_NOT_FOUND');
            }
        }

        const deletedSchool = await SchoolModel.findOneAndUpdate(
            school.filter,
            school.update
        );
        if (!deletedSchool) {
            throw new ApolloError('Failed to delete school', 'SCHOOL_DELETION_FAILED');
        }

        return deletedSchool;
    } catch (error) {
        console.error('Unexpected error in DeleteSchool:', error);

        throw new ApolloError('Failed to delete school:', 'SCHOOL_DELETION_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************
/**
 * Loads the students associated with a school using a DataLoader.
 * @param {object} school - The parent school object.
 * @param {Array<string>} school.students - An array of student IDs to load.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of student objects.
 */
async function StudentLoader(school, _, context) {
    try {
        SchoolValidator.ValidateStudentLoaderInput(school, context);

        const students = await context.dataLoaders.StudentLoader.loadMany(school.students);

        return students;
    } catch (error) {
        console.error("Error fetching students:", error);

        throw new ApolloError(`Failed to fetch students for ${school.name}: ${error.message}`, 'STUDENT_FETCH_FAILED');
    }
}

/**
 * Loads the user who created the school using a DataLoader.
 * @param {object} school - The parent school object.
 * @param {string} school.created_by - The ID of the user who created the school.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(school, _, context) {
    try {
        SchoolValidator.ValidateUserLoaderInput(school, context, 'created_by');

        const createdBy = await context.dataLoaders.UserLoader.load(school.created_by);

        return createdBy;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED', {
            error: error.message
        });
    }
}

/**
 * Loads the user who last updated the school using a DataLoader.
 * @param {object} school - The parent school object.
 * @param {string} school.updated_by - The ID of the user who last updated the school.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(school, _, context) {
    try {
        SchoolValidator.ValidateUserLoaderInput(school, context, 'updated_by');

        const updatedBy = await context.dataLoaders.UserLoader.load(school.updated_by);

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
        GetAllSchools,
        GetOneSchool
    },

    Mutation: {
        CreateSchool,
        UpdateSchool,
        DeleteSchool
    },

    School: {
        students: StudentLoader,
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader
    }
}