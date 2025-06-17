// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const SubjectModel = require('./subject.model');
const BlockModel = require('../block/block.model');

// *************** IMPORT VALIDATOR ***************
const validator = require('./subject.validator');

/**
 * Fetches all subjects from the database, with an optional filter for subject status.
 * @param {string} [subject_status] - Optional. The status of the subjects to fetch (e.g., 'ACTIVE').
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of subject objects.
 */
async function GetAllSubjectsHelper(subject_status) {
    try {
        validator.ValidateGetAllSubjectsInput(subject_status);

        const filter = {};

        if (subject_status) {
            filter.subject_status = subject_status;
        }

        const subjects = await SubjectModel.find(filter);

        return subjects;
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
        validator.ValidateGetOneSubjectInput(id);

        const subject = await SubjectModel.findOne({ _id: id });

        return subject;
    } catch (error) {
        throw new ApolloError(`Failed to fetch subject: ${error.message}`, "INTERNAL_SERVER_ERROR");
    }
}

/**
 * Creates a new subject after validating the input, and updates the parent block.
 * @param {string} block - The ID of the block to which the subject will be added.
 * @param {string} name - The name of the subject.
 * @param {string} description - The description of the subject.
 * @param {number} coefficient - The coefficient value of the subject.
 * @param {string} subject_status - The initial status of the subject (e.g., 'ACTIVE').
 * @returns {Promise<object>} - A promise that resolves to the newly created subject object.
 */
async function CreateSubjectHelper(block, name, description, coefficient, subject_status) {
    try {
        validator.ValidateCreateSubjectInput(block, name, description, coefficient, subject_status);

        const blockCheck = await BlockModel.findOne({
            _id: block,
            block_status: 'ACTIVE'
        });
        if (!blockCheck) {
            throw new ApolloError('Block not found or is not active', 'NOT_FOUND', {
                field: 'block'
            });
        }

        if (typeof subject_status !== 'string') {
            throw new ApolloError('Invalid subject_status: must be a string.', 'INTERNAL_LOGIC_ERROR');
        }

        const upperSubjectStatus = subject_status.toUpperCase();

        const checkTransversalBlock = await BlockModel.findOne({ _id: block, block_type: 'TRANSVERSAL' });
        const isTransversal = checkTransversalBlock ? true : false;

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const createdByUserId = '6846e5769e5502fce150eb67';

        const subjectData = {
            block: block,
            name: name,
            description: description,
            coefficient: coefficient,
            is_transversal: isTransversal,
            subject_status: upperSubjectStatus,
            created_by: createdByUserId,
            updated_by: createdByUserId
        };

        const newSubject = await SubjectModel.create(subjectData);

        if (!newSubject) {
            throw new ApolloError('Subject creation failed', 'SUBJECT_CREATION_FAILED');
        }

        if (!mongoose.Types.ObjectId.isValid(newSubject._id)) {
            throw new ApolloError('Generated subject ID is invalid', 'INVALID_SUBJECT_ID');
        }

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
 * Updates an existing subject after validating the provided data.
 * @param {string} id - The unique identifier of the subject to be updated.
 * @param {string} name - The name of the subject.
 * @param {string} description - The description of the subject.
 * @param {number} coefficient - The coefficient value of the subject.
 * @param {Array<string>} connected_blocks - An array of block IDs to connect to a transversal subject.
 * @param {string} subject_status - The status of the subject (e.g., 'ACTIVE').
 * @returns {Promise<object>} - A promise that resolves to the updated subject object.
 */
async function UpdateSubjectHelper(id, name, description, coefficient, connected_blocks, subject_status) {
    try {
        validator.ValidateUpdateSubjectInput(id, name, description, coefficient, connected_blocks, subject_status);

        const subject = await SubjectModel.findById(id);
        if (!subject) {
            throw new ApolloError(`Subject with ID ${id} not found.`, 'NOT_FOUND', {
                field: 'id'
            });
        }

        if (connected_blocks?.length && !subject.is_transversal) {
            throw new ApolloError('Connected blocks are only allowed when the subject is transversal.', 'BAD_USER_INPUT', {
                field: 'connected_blocks'
            });
        }

        if (typeof subject_status !== 'string') {
            throw new ApolloError('Invalid subject_status: must be a string.', 'INTERNAL_LOGIC_ERROR');
        }

        const upperSubjectStatus = subject_status.toUpperCase();

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const updatedByUserId = '6846e5769e5502fce150eb67';

        const subjectData = {
            name: name,
            description: description,
            coefficient: coefficient,
            connected_blocks: connected_blocks,
            is_transversal: isTransversal,
            subject_status: upperSubjectStatus,
            updated_by: updatedByUserId
        };

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
        validator.ValidateDeleteSubjectInput(id);

        // *************** Using dummy user ID for now (replace with actual user ID from auth/session later)
        const deletedByUserId = '6846e5769e5502fce150eb67';

        const subjectData = {
            subject_status: 'DELETED',
            updated_at: deletedByUserId,
            deleted_by: deletedByUserId,
            deleted_at: Date.now()
        }

        const deletedSubject = await SubjectModel.findOneAndUpdate({ _id: id }, subjectData);

        if (!deletedSubject) {
            throw new ApolloError('Subject deletion failed', 'SUBJECT_DELETION_FAILED');
        }

        if (!mongoose.Types.ObjectId.isValid(deletedSubject._id)) {
            throw new ApolloError('Generated subject ID is invalid', 'INVALID_SUBJECT_ID');
        }

        await BlockModel.updateOne(
            { _id: block, block_status: 'ACTIVE' },
            {
                $pull: { subjects: deletedSubject._id },
                $set: { updated_by: deletedByUserId }
            }
        );

        return deletedSubject;
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