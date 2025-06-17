// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT HELPER FUNCTION *************** 
const helper = require('./subject.helper');

// *************** IMPORT VALIDATOR ***************
const validator = require('./subject.validator');

// *************** QUERY ***************
/**
 * GraphQL resolver to fetch all subjects, with an optional filter for subject status.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} [args.subject_status] - Optional. The status to filter subjects by (e.g., 'ACTIVE').
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of subject objects.
 */
async function GetAllSubjects(_, { subject_status }) {
    try {
        validator.ValidateGetAllSubjectsInput(subject_status);

        const subjects = await helper.GetAllSubjectsHelper(subject_status);

        return subjects;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in GetAllSubjects:', error);

        throw new ApolloError('Failed to retrieve subjects', 'GET_SUBJECTS_FAILED');
    }
}

/**
 * GraphQL resolver to fetch a single subject by its unique ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the query.
 * @param {string} args.id - The unique identifier of the subject to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found subject object.
 */
async function GetOneSubject(_, { id }) {
    try {
        validator.ValidateGetOneSubjectInput(id);

        const subject = await helper.GetOneSubjectHelper(validatedId);

        return subject;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in GetOneSubject:', error);

        throw new ApolloError('Failed to retrieve subject', 'GET_SUBJECT_FAILED');
    }
}

// *************** MUTATION ***************
/**
 * GraphQL resolver to create a new subject.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {object} args.input - An object containing the details for the new subject.
 * @returns {Promise<object>} - A promise that resolves to the newly created subject object.
 */

async function CreateSubject(_, { createSubjectInput }) {
    try {
        validator.ValidateInputTypeObject(createSubjectInput);

        const {
            block,
            name,
            description,
            coefficient,
            subject_status
        } = input;

        await validator.ValidateCreateSubjectInput(block, name, description, coefficient, subject_status);

        const newSubject = await helper.CreateSubjectHelper(validatedInput);

        return newSubject;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in CreateSubject:', error);

        throw new ApolloError('Failed to create subject', 'CREATE_SUBJECT_FAILED');
    }
}

/**
 * GraphQL resolver to update an existing subject.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the subject to update.
 * @param {object} args.input - An object containing the new details for the subject.
 * @returns {Promise<object>} - A promise that resolves to the updated subject object.
 */
async function UpdateSubject(_, { id, updateSubjectInput }) {
    try {
        validator.ValidateInputTypeObject(updateSubjectInput);

        const {
            name,
            description,
            coefficient,
            connected_blocks,
            subject_status
        } = input

        await validator.ValidateUpdateSubjectInput(id, name, description, coefficient, connected_blocks, subject_status);

        const updatedSubject = await helper.UpdateSubjectHelper(id, name, description, coefficient, connected_blocks, subject_status);

        return updatedSubject;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in UpdateSubject:', error);

        throw new ApolloError('Failed to update subject', 'UPDATE_SUBJECT_FAILED');
    }
}

/**
 * GraphQL resolver to delete a subject by its ID.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the subject to delete.
 * @returns {Promise<object>} - A promise that resolves to the deleted subject object.
 */
async function DeleteSubject(_, { id }) {
    try {
        validator.ValidateDeleteSubjectInput(id);

        const deletedSubject = await helper.DeleteSubjectHelper(id);

        return deletedSubject;
    } catch (error) {
        if (error instanceof ApolloError) {
            throw error;
        }

        console.error('Unexpected error in DeleteSubject:', error);

        throw new ApolloError('Failed to delete subject', 'DELETE_SUBJECT_FAILED');
    }
}

// *************** LOADER ***************
/**
 * Loads the block associated with a subject using a DataLoader.
 * @param {object} subject - The parent subject object.
 * @param {string} subject.block - The ID of the block to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the block object.
 */
async function BlockLoader(subject, _, context) {
    try {
        validator.ValidateBlockLoaderInput(subject, context);

        const block = await context.dataLoaders.BlockLoader.load(subject.block);

        return block;
    } catch (error) {
        throw new ApolloError(`Failed to fetch block: ${error.message}`, 'BLOCK_FETCH_FAILED');
    }
}

/**
 * Loads the connected blocks for a transversal subject using a DataLoader.
 * @param {object} subject - The parent subject object.
 * @param {Array<string>} subject.connected_blocks - An array of connected block IDs to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of connected block objects.
 */
async function ConnectedBlocksLoader(subject, _, context) {
    try {
        validator.ValidateConnectedBlocksLoaderInput(subject, context);
        
        const connected_blocks = await context.dataLoaders.BlockLoader.loadMany(subject.connected_blocks);

        return connected_blocks;
    } catch (error) {
        console.error("Error fetching connected_blocks:", error);

        throw new ApolloError(`Failed to fetch connected_blocks for ${subject.name}: ${error.message}`, 'CONNECTED_BLOCKS_FETCH_FAILED');
    }
}

/**
 * Loads the tests associated with a subject using a DataLoader.
 * @param {object} subject - The parent subject object.
 * @param {Array<string>} subject.tests - An array of test IDs to load.
 * @param {object} _ - The arguments object, not used here.
 * @param {object} context - The GraphQL context containing dataLoaders.
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of test objects.
 */
async function TestLoader(subject, _, context) {
    try {
        validator.ValidateTestLoaderInput(subject, context);

        const tests = await context.dataLoaders.TestLoader.loadMany(subject.tests);

        return tests;
    } catch (error) {
        console.error("Error fetching tests:", error);

        throw new ApolloError(`Failed to fetch tests for ${subject.name}: ${error.message}`, 'TEST_FETCH_FAILED');
    }
}

/**
 * Loads the user who created the subject using a DataLoader.
 * @param {object} subject - The parent subject object.
 * @param {string} subject.created_by - The ID of the user who created the subject.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function CreatedByLoader(subject, _, context) {
    try {
        validator.ValidateUserLoaderInput(subject, context, 'created_by');

        const created_by = await context.dataLoaders.UserLoader.load(subject.created_by);

        return created_by;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
    }
}

/**
 * Loads the user who last updated the subject using a DataLoader.
 * @param {object} subject - The parent subject object.
 * @param {string} subject.updated_by - The ID of the user who last updated the subject.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function UpdatedByLoader(subject, _, context) {
    try {
        validator.ValidateUserLoaderInput(subject, context, 'updated_by');

        const updated_by = await context.dataLoaders.UserLoader.load(subject.updated_by);

        return updated_by;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
    }
}

/**
 * Loads the user who deleted the subject using a DataLoader.
 * @param {object} subject - The parent subject object.
 * @param {string} subject.updated_by - The ID of the user who performed the deletion.
 * @param {object} _ - The arguments object, not used in this resolver.
 * @param {object} context - The GraphQL context containing the dataLoaders.
 * @returns {Promise<object>} - A promise that resolves to the user object.
 */
async function DeletedByLoader(subject, _, context) {
    try {
        validator.ValidateUserLoaderInput(subject, context, 'deleted_by');

        const deleted_by = await context.dataLoaders.UserLoader.load(subject.updated_by);

        return deleted_by;
    } catch (error) {
        throw new ApolloError(`Failed to fetch user: ${error.message}`, 'USER_FETCH_FAILED');
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    Query: {
        GetAllSubjects,
        GetOneSubject
    },

    Mutation: {
        CreateSubject,
        UpdateSubject,
        DeleteSubject
    },

    Subject: {
        block: BlockLoader,
        connected_blocks: ConnectedBlocksLoader,
        tests: TestLoader,
        created_by: CreatedByLoader,
        updated_by: UpdatedByLoader,
        deleted_by: DeletedByLoader
    }
}