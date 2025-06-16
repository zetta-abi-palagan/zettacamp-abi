// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const mongoose = require('mongoose');
const validator = require('validator');

// *************** IMPORT MODULE *************** 
const SchoolModel = require('./school.model');

// *************** QUERY ***************
/**
 * Fetches all schools with an 'ACTIVE' status.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of active school objects.
 */
async function GetAllSchools() {
    try {
        return await SchoolModel.find({ school_status: 'ACTIVE' });
    } catch (error) {
        throw new ApolloError(`Failed to fetch schools: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Fetches a single active school by its unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The unique identifier of the school to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found school object.
 */
async function GetOneSchool(_, { id }) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    try {
        const school = await SchoolModel.findOne({ _id: id, school_status: 'ACTIVE' })
        if (!school) {
            throw new ApolloError("School not found", "NOT_FOUND");
        }

        return school;
    } catch (error) {
        throw new ApolloError(`Failed to fetch school: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

// *************** MUTATION ***************
/**
 * Creates a new school with the provided input data.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {object} args.input - The data for the new school.
 * @returns {Promise<object>} - A promise that resolves to the newly created school object.
 */
async function CreateSchool(_, { input }) {
    const {
        commercial_name,
        legal_name,
        address,
        city,
        country,
        zipcode,
        logo,
        school_status
    } = input;

    const validStatus = ['ACTIVE', 'INACTIVE'];

    if (!commercial_name || validator.isEmpty(commercial_name, { ignore_whitespace: true })) {
        throw new ApolloError('Commercial name is required.', 'BAD_USER_INPUT', {
            field: 'commercial_name'
        });
    }

    if (!legal_name || validator.isEmpty(legal_name, { ignore_whitespace: true })) {
        throw new ApolloError('Legal name is required.', 'BAD_USER_INPUT', {
            field: 'legal_name'
        });
    }

    if (!address || validator.isEmpty(address, { ignore_whitespace: true })) {
        throw new ApolloError('Address is required.', 'BAD_USER_INPUT', {
            field: 'address'
        });
    }

    if (!city || validator.isEmpty(city, { ignore_whitespace: true })) {
        throw new ApolloError('City is required.', 'BAD_USER_INPUT', {
            field: 'city'
        });
    }

    if (!country || validator.isEmpty(country, { ignore_whitespace: true })) {
        throw new ApolloError('Country is required.', 'BAD_USER_INPUT', {
            field: 'country'
        });
    }

    if (!zipcode || validator.isEmpty(zipcode, { ignore_whitespace: true })) {
        throw new ApolloError('Zipcode is required.', 'BAD_USER_INPUT', {
            field: 'zipcode'
        });
    }

    if (logo && !validator.isURL(logo)) {
        throw new ApolloError('Logo must be a valid URL.', 'BAD_USER_INPUT', {
            field: 'logo'
        });
    }

    if (!school_status || !validator.isIn(school_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`School status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'school_status'
        });
    }

    try {
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const createdByUserId = '6846e5769e5502fce150eb67';

        const schoolData = {
            commercial_name: commercial_name,
            legal_name: legal_name,
            address: address,
            city: city,
            country: country,
            zipcode: zipcode,
            logo: logo,
            school_status: school_status.toUpperCase(),
            created_by: createdByUserId,
            updated_by: createdByUserId
        }

        return await SchoolModel.create(schoolData);
    } catch (error) {
        throw new ApolloError('Failed to create school:', 'SCHOOL_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * Updates an existing school's information.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The unique identifier of the school to update.
 * @param {object} args.input - The new data to update for the school.
 * @returns {Promise<object>} - A promise that resolves to the updated school object.
 */
async function UpdateSchool(_, { id, input }) {
    const {
        commercial_name,
        legal_name,
        address,
        city,
        country,
        zipcode,
        logo,
        school_status
    } = input;

    const validStatus = ['ACTIVE', 'INACTIVE'];

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    if (!commercial_name || validator.isEmpty(commercial_name, { ignore_whitespace: true })) {
        throw new ApolloError('Commercial name is required.', 'BAD_USER_INPUT', {
            field: 'commercial_name'
        });
    }

    if (!legal_name || validator.isEmpty(legal_name, { ignore_whitespace: true })) {
        throw new ApolloError('Legal name is required.', 'BAD_USER_INPUT', {
            field: 'legal_name'
        });
    }

    if (!address || validator.isEmpty(address, { ignore_whitespace: true })) {
        throw new ApolloError('Address is required.', 'BAD_USER_INPUT', {
            field: 'address'
        });
    }

    if (!city || validator.isEmpty(city, { ignore_whitespace: true })) {
        throw new ApolloError('City is required.', 'BAD_USER_INPUT', {
            field: 'city'
        });
    }

    if (!country || validator.isEmpty(country, { ignore_whitespace: true })) {
        throw new ApolloError('Country is required.', 'BAD_USER_INPUT', {
            field: 'country'
        });
    }

    if (!zipcode || validator.isEmpty(zipcode, { ignore_whitespace: true })) {
        throw new ApolloError('Zipcode is required.', 'BAD_USER_INPUT', {
            field: 'zipcode'
        });
    }

    if (logo && !validator.isURL(logo)) {
        throw new ApolloError('Logo must be a valid URL.', 'BAD_USER_INPUT', {
            field: 'logo'
        });
    }

    if (!school_status || !validator.isIn(school_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`School status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'school_status'
        });
    }

    try {
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const updatedByUserId = '6846e5769e5502fce150eb67';

        const schoolData = {
            commercial_name: commercial_name,
            legal_name: legal_name,
            address: address,
            city: city,
            country: country,
            zipcode: zipcode,
            logo: logo,
            school_status: school_status.toUpperCase(),
            updated_by: updatedByUserId
        }

        return await SchoolModel.findOneAndUpdate({ _id: id }, schoolData, { new: true });
    } catch (error) {
        throw new ApolloError('Failed to update school:', 'SCHOOL_UPDATE_FAILED', {
            error: error.message
        });
    }
}

/**
 * Deletes a school by changing its status to 'DELETED'.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments object.
 * @param {string} args.id - The unique identifier of the school to delete.
 * @returns {Promise<object>} - A promise that resolves to the school object with a 'DELETED' status.
 */
async function DeleteSchool(_, { id }) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    try {
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const deletedByUserId = '6846e5769e5502fce150eb67';

        const schoolData = {
            school_status: 'DELETED',
            deleted_by: deletedByUserId,
            deleted_at: Date.now()
        }
        return await SchoolModel.findOneAndUpdate({ _id: id }, schoolData)
    } catch (error) {
        throw new ApolloError('Failed to delete school:', 'SCHOOL_DELETION_FAILED', {
            error: error.message
        });
    }
}

// *************** LOADER ***************
/**
 * Loads the students associated with a school using a DataLoader.
 * @param {object} parent - The parent school object.
 * @param {string} parent.students - The list of student IDs to load for the school.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of student objects.
 */
async function StudentLoader(parent, _, context) {
    try {
        return await context.dataLoaders.StudentLoader.loadMany(parent.students);
    } catch (error) {
        console.error("Error fetching students:", error);

        throw new ApolloError(`Failed to fetch students for ${parent.name}: ${error.message}`, 'STUDENT_FETCH_FAILED');
    }
}

/**
 * Loads the user who created the record using a DataLoader.
 * @param {object} parent - The parent school object.
 * @param {string} parent.created_by - The ID of the user to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(parent, _, context) {
    try {
        return await context.dataLoaders.UserLoader.load(parent.created_by);
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
    }
}

/**
 * Loads the user who last updated the record using a DataLoader.
 * @param {object} parent - The parent school object.
 * @param {string} parent.updated_by - The ID of the user to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(parent, _, context) {
    try {
        return await context.dataLoaders.UserLoader.load(parent.updated_by);
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
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