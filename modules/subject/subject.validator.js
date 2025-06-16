// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');
const validator = require('validator');

// *************** IMPORT MODULE *************** 
const BlockModel = require('../block/block.model');

/**
 * Validates the input for fetching all subjects.
 * @param {string} subject_status - The status of the subjects to filter by (optional).
 * @returns {string} The validated subject_status.
 */
function ValidateGetAllSubjectsInput(subject_status) {
    const validStatus = ['ACTIVE', 'INACTIVE', 'DELETED'];

    if (subject_status && !validator.isIn(subject_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`Subject status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'subject_status'
        });
    }

    return subject_status
}

/**
 * Validates the input for fetching a single subject.
 * @param {string} id - The ID of the subject to validate.
 * @returns {string} The validated subject ID.
 */
function ValidateGetOneSubjectInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    return id;
}

/**
 * Validates the input fields for creating a new subject.
 * @param {string} block - The ID of the block to which the subject will be added.
 * @param {string} name - The name of the subject.
 * @param {string} description - The description of the subject.
 * @param {number} coefficient - The coefficient value of the subject.
 * @param {string} subject_status - The initial status of the subject (e.g., 'ACTIVE').
 * @returns {object} An object containing the validated input data.
 */
async function ValidateCreateSubjectInput(block, name, description, coefficient, subject_status) {
    const validStatus = ['ACTIVE', 'INACTIVE'];

    const isValidBlockId = mongoose.Types.ObjectId.isValid(block);
    if (!isValidBlockId) {
        throw new ApolloError(`Invalid block ID: ${block}`, "BAD_USER_INPUT", {
            field: block
        });
    }

    const blockCheck = await BlockModel.findOne({ _id: block, block_status: 'ACTIVE' });
    if (!blockCheck) {
        throw new ApolloError('Block not found', 'NOT_FOUND', {
            field: 'block'
        });
    }

    if (!name || validator.isEmpty(name, { ignore_whitespace: true })) {
        throw new ApolloError('Name is required.', 'BAD_USER_INPUT', {
            field: 'name'
        });
    }

    if (!description || validator.isEmpty(description, { ignore_whitespace: true })) {
        throw new ApolloError('Description is required.', 'BAD_USER_INPUT', {
            field: 'description'
        });
    }

    if (!coefficient || typeof coefficient !== 'number' || isNaN(coefficient) || coefficient < 0) {
        throw new ApolloError('Coefficient is required, and must be greater than or equal to 0.', 'BAD_USER_INPUT', {
            field: 'description'
        });
    }

    if (!subject_status || !validator.isIn(subject_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`Subject status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'subject_status'
        });
    }

    return {
        block,
        name,
        description,
        coefficient,
        subject_status
    }
}

/**
 * Validates the input fields for updating an existing subject.
 * @param {string} id - The unique identifier of the subject to be updated.
 * @param {string} name - The name of the subject.
 * @param {string} description - The description of the subject.
 * @param {number} coefficient - The coefficient value of the subject.
 * @param {Array<string>} connected_blocks - An array of block IDs to connect to a transversal subject.
 * @param {string} subject_status - The status of the subject (e.g., 'ACTIVE').
 * @returns {object} An object containing the validated input data.
 */
async function ValidateUpdateSubjectInput(id, name, description, coefficient, connected_blocks, subject_status) {
    const validStatus = ['ACTIVE', 'INACTIVE'];

    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    const subject = await SubjectModel.findById(id);
    if (!subject) {
        throw new ApolloError(`Subject with ID ${id} not found.`, 'NOT_FOUND', {
            field: 'id'
        });
    }

    if (!name || validator.isEmpty(name, { ignore_whitespace: true })) {
        throw new ApolloError('Name is required.', 'BAD_USER_INPUT', {
            field: 'name'
        });
    }

    if (!description || validator.isEmpty(description, { ignore_whitespace: true })) {
        throw new ApolloError('Description is required.', 'BAD_USER_INPUT', {
            field: 'description'
        });
    }

    if (!coefficient || typeof coefficient !== 'number' || isNaN(coefficient) || coefficient < 0) {
        throw new ApolloError('Coefficient is required, and must be greater than or equal to 0.', 'BAD_USER_INPUT', {
            field: 'description'
        });
    }

    if (connected_blocks && connected_blocks.length > 0) {
        const { is_transversal } = subject;

        if (!is_transversal) {
            throw new ApolloError('Connected blocks are only allowed when the subject is transversal.', 'BAD_USER_INPUT', {
                field: 'connected_blocks'
            });
        }

        if (!Array.isArray(connected_blocks)) {
            throw new ApolloError('Connected blocks must be an array.', 'BAD_USER_INPUT', {
                field: 'connected_blocks'
            });
        }

        for (const blockId of connected_blocks) {
            if (!mongoose.Types.ObjectId.isValid(blockId)) {
                throw new ApolloError(`Invalid connected block ID: ${blockId}`, 'BAD_USER_INPUT', {
                    field: 'connected_blocks'
                });
            }
        }
    }

    if (!subject_status || !validator.isIn(subject_status.toUpperCase(), validStatus)) {
        throw new ApolloError(`Subject status must be one of: ${validStatus.join(', ')}.`, 'BAD_USER_INPUT', {
            field: 'subject_status'
        });
    }

    return {
        id,
        block,
        name,
        description,
        coefficient,
        connected_blocks,
        subject_status
    }
}

/**
 * Validates the input ID for deleting a subject.
 * @param {string} id - The ID of the subject to validate.
 * @returns {string} The validated subject ID.
 */
function ValidateDeleteSubjectInput(id) {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    if (!isValidObjectId) {
        throw new ApolloError(`Invalid ID: ${id}`, "BAD_USER_INPUT");
    }

    return id;
}

// *************** EXPORT MODULE ***************
module.exports = {
    ValidateGetAllSubjectsInput,
    ValidateGetOneSubjectInput,
    ValidateCreateSubjectInput,
    ValidateUpdateSubjectInput,
    ValidateDeleteSubjectInput
};