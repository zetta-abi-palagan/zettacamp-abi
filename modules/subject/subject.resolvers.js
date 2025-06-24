// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const BlockModel = require('../block/block.model');
const SubjectModel = require('./subject.model');
const TestModel = require('../test/test.model');
const StudentTestResultModel = require('../studentTestResult/student_test_result.model');
const TaskModel = require('../task/task.model');

// *************** IMPORT HELPER FUNCTION *************** 
const SubjectHelper = require('./subject.helper');

// *************** IMPORT VALIDATOR ***************
const SubjectValidator = require('./subject.validator');
const CommonValidator = require('../../shared/validator/index');

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
        SubjectValidator.ValidateSubjectStatusFilter(subject_status);

        const subjectFilter = subject_status ? { subject_status: subject_status } : { subject_status: { $ne: 'DELETED' } };

        const subjects = await SubjectModel.find(subjectFilter).lean();

        return subjects;
    } catch (error) {
        console.error('Unexpected error in GetAllSubjects:', error);

        throw new ApolloError('Failed to retrieve subjects', 'GET_SUBJECTS_FAILED', {
            error: error.message
        });
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
        CommonValidator.ValidateObjectId(id);

        const subject = await SubjectModel.findOne({ _id: id }).lean();
        if (!subject) {
            throw new ApolloError('Subject not found', 'NOT_FOUND');
        }

        return subject;
    } catch (error) {
        console.error('Unexpected error in GetOneSubject:', error);

        throw new ApolloError('Failed to retrieve subject', 'GET_SUBJECT_FAILED', {
            error: error.message
        });
    }
}

// *************** MUTATION ***************
/**
 * GraphQL resolver to create a new subject.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {object} args.createSubjectInput - An object containing the details for the new subject.
 * @returns {Promise<object>} - A promise that resolves to the newly created subject object.
 */
async function CreateSubject(_, { createSubjectInput }) {
    try {
        // *************** Dummy user ID (replace with real one later)
        const userId = '6846e5769e5502fce150eb67';

        CommonValidator.ValidateInputTypeObject(createSubjectInput);
        CommonValidator.ValidateObjectId(createSubjectInput.block);

        // *************** Ensure parent block exists and is active
        const parentBlock = await BlockModel.findOne({ _id: createSubjectInput.block, block_status: { $ne: 'DELETED' } }).lean();
        if (!parentBlock) {
            throw new ApolloError('Parent block not found.', 'NOT_FOUND');
        }

        // *************** Determine if subject is transversal based on parent block type
        const isTransversal = parentBlock.block_type === 'TRANSVERSAL';

        SubjectValidator.ValidateSubjectInput({ subjectInput: createSubjectInput, isTransversal });

        // *************** Prepare payload and create subject
        const createSubjectPayload = SubjectHelper.GetCreateSubjectPayload({ subjectInput: createSubjectInput, isTransversal, userId });

        const newSubject = await SubjectModel.create(createSubjectPayload);
        if (!newSubject) {
            throw new ApolloError('Failed to create subject in database', 'CREATE_SUBJECT_FAILED');
        }

        // *************** Add new subject to parent block's subjects array
        const updatedBlock = await BlockModel.updateOne(
            { _id: createSubjectInput.block },
            { $addToSet: { subjects: newSubject._id } }
        );
        if (!updatedBlock.nModified) {
            throw new ApolloError('Failed to add subject to block', 'BLOCK_UPDATE_FAILED');
        }

        return newSubject;
    } catch (error) {
        console.error('Unexpected error in CreateSubject:', error);

        throw new ApolloError('Failed to create subject', 'CREATE_SUBJECT_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to update an existing subject.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the subject to update.
 * @param {object} args.updateSubjectInput - An object containing the new details for the subject.
 * @returns {Promise<object>} - A promise that resolves to the updated subject object.
 */
async function UpdateSubject(_, { id, updateSubjectInput }) {
    try {
        // *************** Dummy user ID (replace with real one later)
        const userId = '6846e5769e5502fce150eb67';

        CommonValidator.ValidateObjectId(id);
        CommonValidator.ValidateInputTypeObject(updateSubjectInput);

        // *************** Find the subject to ensure it exists and get its is_transversal property
        const subject = await SubjectModel.findById(id).lean();
        if (!subject) {
            throw new ApolloError('Subject not found', 'NOT_FOUND');
        }
        SubjectValidator.ValidateSubjectInput(updateSubjectInput, subject.is_transversal);

        // *************** Prepare the payload and update the subject
        const updateSubjectPayload = SubjectHelper.GetUpdateSubjectPayload({ updateSubjectInput, userId, isTransversal: subject.is_transversal });

        const updatedSubject = await SubjectModel.findOneAndUpdate({ _id: id }, updateSubjectPayload, { new: true }).lean();
        if (!updatedSubject) {
            throw new ApolloError('Subject update failed', 'UPDATE_SUBJECT_FAILED');
        }

        return updatedSubject;
    } catch (error) {
        console.error('Unexpected error in UpdateSubject:', error);

        throw new ApolloError('Failed to update subject', 'UPDATE_SUBJECT_FAILED', {
            error: error.message
        });
    }
}

/**
 * GraphQL resolver to perform a deep, cascading soft delete on a subject and all its descendants,
 * and removes the subject's reference from its parent block.
 * @param {object} _ - The parent object, which is not used in this resolver.
 * @param {object} args - The arguments for the mutation.
 * @param {string} args.id - The unique identifier of the subject to delete.
 * @returns {Promise<object>} - A promise that resolves to the subject object as it was before being soft-deleted.
 */
async function DeleteSubject(_, { id }) {
    try {
        // *************** Dummy user ID (replace with real one later)
        const userId = '6846e5769e5502fce150eb67';

        CommonValidator.ValidateObjectId(id);

        // *************** Prepare payloads for cascading soft delete
        const {
            subject,
            block,
            tests,
            tasks,
            studentTestResults
        } = await SubjectHelper.GetDeleteSubjectPayload({ subjectId: id, userId });

        // *************** Soft delete student test results if any
        if (studentTestResults) {
            const studentResultUpdate = await StudentTestResultModel.updateMany(
                studentTestResults.filter,
                studentTestResults.update
            );
            if (!studentResultUpdate.nModified) {
                throw new ApolloError('No student test results matched for deletion', 'STUDENT_RESULTS_NOT_FOUND');
            }
        }

        // *************** Soft delete tasks if any
        if (tasks) {
            const taskUpdate = await TaskModel.updateMany(
                tasks.filter,
                tasks.update
            );
            if (!taskUpdate.nModified) {
                throw new ApolloError('No tasks matched for deletion', 'TASKS_NOT_FOUND');
            }
        }

        // *************** Soft delete tests if any
        if (tests) {
            const testUpdate = await TestModel.updateMany(
                tests.filter,
                tests.update
            );
            if (!testUpdate.nModified) {
                throw new ApolloError('No tests matched for deletion', 'TESTS_NOT_FOUND');
            }
        }

        // *************** Soft delete the subject itself
        const deletedSubject = await SubjectModel.findOneAndUpdate(
            subject.filter,
            subject.update
        ).lean();

        if (!deletedSubject) {
            throw new ApolloError('Subject deletion failed', 'SUBJECT_DELETION_FAILED');
        }

        // *************** Remove subject reference from parent block
        const updatedBlock = await BlockModel.updateOne(
            block.filter,
            block.update
        );

        if (!updatedBlock) {
            throw new ApolloError('Failed to update block (remove subject)', 'BLOCK_UPDATE_FAILED');
        }

        return deletedSubject;
    } catch (error) {
        console.error('Unexpected error in DeleteSubject:', error);

        throw new ApolloError('Failed to delete subject', 'DELETE_SUBJECT_FAILED', {
            error: error.message
        });
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
        SubjectValidator.ValidateBlockLoaderInput(subject, context);

        const block = await context.dataLoaders.BlockLoader.load(subject.block);

        return block;
    } catch (error) {
        throw new ApolloError(`Failed to fetch block`, 'BLOCK_FETCH_FAILED', {
            error: error.message
        });
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
        SubjectValidator.ValidateConnectedBlocksLoaderInput(subject, context);

        const connected_blocks = await context.dataLoaders.BlockLoader.loadMany(subject.connected_blocks);

        return connected_blocks;
    } catch (error) {
        console.error("Error fetching connected_blocks:", error);

        throw new ApolloError(`Failed to fetch connected_blocks for ${subject.name}`, 'CONNECTED_BLOCKS_FETCH_FAILED', {
            error: error.message
        });
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
        SubjectValidator.ValidateTestLoaderInput(subject, context);

        const tests = await context.dataLoaders.TestLoader.loadMany(subject.tests);

        return tests;
    } catch (error) {
        console.error("Error fetching tests:", error);

        throw new ApolloError(`Failed to fetch tests for ${subject.name}`, 'TEST_FETCH_FAILED', {
            error: error.message
        });
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
        SubjectValidator.ValidateUserLoaderInput(subject, context, 'created_by');

        const created_by = await context.dataLoaders.UserLoader.load(subject.created_by);

        return created_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
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
        SubjectValidator.ValidateUserLoaderInput(subject, context, 'updated_by');

        const updated_by = await context.dataLoaders.UserLoader.load(subject.updated_by);

        return updated_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
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
        SubjectValidator.ValidateUserLoaderInput(subject, context, 'deleted_by');

        const deleted_by = await context.dataLoaders.UserLoader.load(subject.deleted_by);

        return deleted_by;
    } catch (error) {
        throw new ApolloError('Failed to fetch user', 'USER_FETCH_FAILED', {
            error: error.message
        });
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