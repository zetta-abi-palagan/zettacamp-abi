// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT UTILITIES *************** 
const { SoftDelete } = require('../../shared/utils/database.utils');

// *************** IMPORT VALIDATOR ***************
const { IsValidObjectId } = require('../../shared/validator/object_id');

// *************** QUERY ***************
/**
 * Fetches all active schools, including their associated students.
 * @param {object} context - The GraphQL context containing models.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of school objects with populated students.
 * @throws {ApolloError} If there is an error during the database query.
 */
async function GetAllSchools(_, _, context) {
    try {
        const schools = await context.models.School.find({ deleted_at: null });

        return schools;
    } catch (error) {
        throw new ApolloError(`Failed to fetch schools: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Retrieves a single school by its ID, ensuring the ID is valid and the school is not deleted.

 * @param {Object} _ - Unused resolver root argument.
 * @param {Object} args - The arguments object.
 * @param {string} args.id - The ID of the school to retrieve.
 * @param {object} context - The GraphQL context containing models.
 * @returns {Promise<Object>} The school document with populated students.
 * @throws {ApolloError} If the ID is invalid, the school is not found, or fetching fails.
 */
async function GetOneSchool(_, { id }, context) {
    if (!IsValidObjectId(id)) {
        throw new ApolloError(`Invalid ID: ${id}`, 'BAD_USER_INPUT');
    }

    try {
        const school = await context.models.School.findById({
            _id: id,
            deleted_at: null
        });

        if (!school || school.deleted_at) {
            throw new ApolloError('School not found', 'NOT_FOUND');
        }

        return school;
    } catch (error) {
        throw new ApolloError(`Failed to fetch school: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}

// *************** MUTATION ***************
/**
 * Creates a new school entry in the database.
 * @param {Object} _ - Unused resolver root argument.
 * @param {Object} args - The resolver arguments.
 * @param {Object} args.input - The input object containing school details.
 * @param {string} args.input.name - The name of the school (required).
 * @param {string} [args.input.address] - The address of the school (optional).
 * @param {object} context - The GraphQL context containing models.
 * @returns {Promise<Object>} The created school document.
 * @throws {ApolloError} If the name field is missing or if creation fails.
 */
async function CreateSchool(_, { input }, context) {
    const { name, address } = input;

    if (name === undefined) {
        throw new ApolloError('Field "name" is required', 'BAD_USER_INPUT');
    }

    try {
        const school = { name, address };
        return await context.models.School.create(school);
    } catch (error) {
        console.error(`CreateSchool Resolver Error:`, error);
        throw new ApolloError(`Failed to create school: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Updates a school document by its ID with the provided input fields.
 * @param {Object} _ - Unused resolver root argument.
 * @param {Object} args - The arguments object.
 * @param {string} args.id - The ID of the school to update.
 * @param {Object} args.input - The input fields to update.
 * @param {string} [args.input.name] - The new name of the school (optional).
 * @param {string} [args.input.address] - The new address of the school (optional).
 * @param {object} context - The GraphQL context containing models.
 * @returns {Promise<Object|null>} The updated school document, or null if not found.
 * @throws {ApolloError} If the provided ID is invalid or the update operation fails.
 */
async function UpdateSchool(_, { id, input }, context) {
    const { name, address } = input;

    if (!IsValidObjectId(id)) {
        throw new ApolloError(`Invalid ID: ${id}`, 'BAD_USER_INPUT');
    }

    try {
        const update = {};
        if (name !== undefined) update.name = name;
        if (address !== undefined) update.address = address;

        return await context.models.School.findByIdAndUpdate(id, update, { new: true });
    } catch (error) {
        console.error(`UpdateSchool Resolver Error for ID ${id}:`, error);
        throw new ApolloError(`Failed to update school: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Deletes a school by its ID using soft delete.
 * @param {Object} _ - Unused resolver root argument.
 * @param {Object} args - Arguments object.
 * @param {string} args.id - The ID of the school to delete.
 * @param {object} context - The GraphQL context containing models.
 * @returns {Promise<Object>} The result of the soft delete operation.
 * @throws {ApolloError} If the provided ID is invalid, the school is not found, or deletion fails.
 */
async function DeleteSchool(_, { id }, context) {
    if (!IsValidObjectId(id)) {
        throw new ApolloError(`Invalid ID: ${id}`, 'BAD_USER_INPUT');
    }

    try {
        const school = await context.models.School.findById(id);

        if (!school || school.deleted_at) {
            throw new ApolloError('School not found', 'NOT_FOUND');
        }

        return await SoftDelete(school);
    } catch (error) {
        throw new ApolloError(`Failed to delete school: ${error.message}`, 'INTERNAL_SERVER_ERROR');
    }
}

/**
 * Resolves and fetches students for a parent object using a DataLoader.
 * @param {object} parent - The parent object from the resolver chain (e.g., a School).
 * @param {object} _ - The GraphQL arguments for the field (not used).
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of student objects.
 * @throws {ApolloError} If fetching students via the DataLoader fails.
 */
async function ResolveStudents(parent, _, context) {
  try {
    return await context.dataLoaders.StudentLoader.load(parent.id);
  } catch (error) {
    console.error("Error fetching students:", error);

    throw new ApolloError(`Failed to fetch students for ${parent.name}: ${error.message}`, 'STUDENT_FETCH_FAILED');
  }
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetAllSchools,
    GetOneSchool,
    CreateSchool,
    UpdateSchool,
    DeleteSchool,
    ResolveStudents
}