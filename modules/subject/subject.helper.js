// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const SubjectModel = require('./subject.model');
const BlockModel = require('../block/block.model');

// *************** QUERY ***************
/**
 * Fetches all subjects from the database, with an optional filter for subject status.
 * @param {string} [subject_status] - Optional. The status of the subjects to fetch (e.g., 'ACTIVE').
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of subject objects.
 */

async function GetAllSubjectsHelper(subject_status) {
    try {
        const filter = {};

        if (subject_status) {
            filter.subject_status = subject_status;
        }

        return await SubjectModel.find(filter);
    } catch (error) {
        throw new ApolloError(`Failed to fetch subjects: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Fetches a single subject by its unique ID.
 * @param {string} id - The unique identifier of the subject to retrieve.
 * @returns {Promise<object>} - A promise that resolves to the found subject object.
 */
async function GetOneSubjectHelper(id) {
    try {
        return await SubjectModel.findOne({ _id: id });
    } catch (error) {
        throw new ApolloError(`Failed to fetch subject: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

// *************** MUTATION ***************
/**
 * Creates a new subject and associates it with a block.
 * It also determines if the subject is transversal based on the parent block's type.
 * @param {object} input - An object containing the details for the new subject.
 * @returns {Promise<object>} - A promise that resolves to the newly created subject object.
 */
async function CreateSubjectHelper(input) {
    const {
        block,
        name,
        description,
        coefficient,
        subject_status
    } = input;

    const checkTransversalBlock = await BlockModel.findOne({ _id: block, block_type: 'TRANSVERSAL' })
    const isTransversal = checkTransversalBlock ? true : false;

    // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
    const createdByUserId = '6846e5769e5502fce150eb67';

    const subjectData = {
        block: block,
        name: name,
        description: description,
        coefficient: coefficient,
        is_transversal: isTransversal,
        subject_status: subject_status,
        created_by: createdByUserId,
        updated_by: createdByUserId
    };

    try {
        const newSubject = await SubjectModel.create(subjectData);

        await BlockModel.updateOne(
            { _id: block, block_status: 'ACTIVE' },
            {
                $addToSet: { subjects: newSubject._id },
                $set: { updated_by: createdByUserId }
            }
        );

        return newSubject;
    } catch (error) {
        throw new ApolloError('Failed to create subject', 'SUBJECT_CREATION_FAILED', {
            error: error.message
        });
    }
}

/**
 * Updates an existing subject in the database with the provided data.
 * @param {object} input - An object containing the subject's ID and the fields to be updated.
 * @returns {Promise<object>} - A promise that resolves to the updated subject object.
 */
async function UpdateSubjectHelper(input) {
    const {
        id,
        name,
        description,
        coefficient,
        connected_blocks,
        subject_status
    } = input;

    // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
    const updatedByUserId = '6846e5769e5502fce150eb67';

    const subjectData = {
        name: name,
        description: description,
        coefficient: coefficient,
        connected_blocks: connected_blocks,
        is_transversal: isTransversal,
        subject_status: subject_status,
        updated_by: updatedByUserId
    };

    try {
        const updatedSubject = await SubjectModel.findOneAndUpdate({ _id: id }, subjectData, { new: true });

        return updatedSubject;
    } catch (error) {
        throw new ApolloError('Failed to update subject', 'SUBJECT_UPDATE_FAILED', {
            error: error.message
        });
    }
}

/**
 * Performs a soft delete on a subject by updating its status to 'DELETED'.
 * @param {string} id - The unique identifier of the subject to be deleted.
 * @returns {Promise<object>} - A promise that resolves to the subject object before the update.
 */
async function DeleteSubjectHelper(id) {
    try {
        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const deletedByUserId = '6846e5769e5502fce150eb67';

        const subjectData = {
            subject_status: 'DELETED',
            updated_at: deletedByUserId,
            deleted_by: deletedByUserId,
            deleted_at: Date.now()
        }

        return await SubjectModel.findOneAndUpdate({ _id: id }, subjectData);
    } catch (error) {
        throw new ApolloError('Failed to delete subject', 'SUBJECT_DELETION_FAILED', {
            error: error.message
        });
    }
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetAllSubjectsHelper,
    GetOneSubjectHelper,
    CreateSubjectHelper,
    UpdateSubjectHelper,
    DeleteSubjectHelper
}