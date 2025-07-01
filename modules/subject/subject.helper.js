// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const SubjectModel = require('./subject.model');

// *************** IMPORT UTILITES ***************
const CommonHelper = require('../../shared/helper/index')

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../../shared/validator/index');
const SubjectValidator = require('./subject.validator');

/**
 * Processes and transforms a raw subject input object into a structured data payload for a create operation.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.subjectInput - The raw input object containing the subject's properties.
 * @param {string} args.subjectInput.block - The ID of the parent block.
 * @param {string} args.subjectInput.name - The name of the subject.
 * @param {string} args.subjectInput.description - The description of the subject.
 * @param {number} args.subjectInput.coefficient - The coefficient value for the subject.
 * @param {string} args.subjectInput.subject_status - The initial status of the subject.
 * @param {boolean} args.isTransversal - A flag indicating if the subject is transversal.
 * @param {string} args.userId - The ID of the user creating the subject.
 * @returns {object} A processed data payload suitable for a database create operation.
 */
function GetCreateSubjectPayload({ subjectInput, isTransversal, userId }) {
    CommonValidator.ValidateInputTypeObject(subjectInput);
    CommonValidator.ValidateObjectId(userId);
    SubjectValidator.ValidateSubjectInput({ subjectInput, isTransversal });

    const {
        block,
        name,
        description,
        coefficient,
        subject_status
    } = subjectInput;

    return {
        block,
        name,
        description,
        coefficient,
        is_transversal: isTransversal,
        subject_status: subject_status.toUpperCase(),
        created_by: userId,
        updated_by: userId
    };
}

/**
 * Processes and transforms a raw subject input object into a structured data payload for an update operation.
 * @param {object} args - The arguments for creating the payload.
 * @param {object} args.subjectInput - The raw input object containing the subject's properties to update.
 * @param {string} args.subjectInput.name - The name of the subject.
 * @param {string} args.subjectInput.description - The description of the subject.
 * @param {number} args.subjectInput.coefficient - The coefficient value for the subject.
 * @param {Array<string>} [args.subjectInput.connected_blocks] - Optional. An array of connected block IDs.
 * @param {string} args.subjectInput.subject_status - The status of the subject.
 * @param {string} args.userId - The ID of the user updating the subject.
 * @param {boolean} args.isTransversal - A flag indicating if the subject is transversal.
 * @returns {object} A processed data payload suitable for a database update operation.
 */
function GetUpdateSubjectPayload({ subjectInput, userId, isTransversal }) {
    CommonValidator.ValidateInputTypeObject(subjectInput);
    CommonValidator.ValidateObjectId(userId);
    SubjectValidator.ValidateSubjectInput({ subjectInput, isTransversal, isUpdate: true });

    const {
        name,
        description,
        coefficient,
        connected_blocks,
        subject_status,
        subject_passing_criteria
    } = subjectInput;

    return {
        name,
        description,
        coefficient,
        connected_blocks,
        subject_status: subject_status ? subject_status.toUpperCase() : undefined,
        subject_passing_criteria,
        updated_by: userId
    };
}

/**
 * Generates a payload for a deep, cascading soft delete of a subject and its descendants.
 * @param {object} args - The arguments for getting the delete payload.
 * @param {string} args.subjectId - The unique identifier of the root subject to be deleted.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for all required delete and update operations.
 */
async function GetDeleteSubjectPayload({ subjectId, userId }) {
    try {
        CommonValidator.ValidateObjectId(subjectId);
        CommonValidator.ValidateObjectId(userId);

        const deletionTimestamp = Date.now();

        const subject = await SubjectModel.findOne({ _id: subjectId, subject_status: { $ne: 'DELETED' } });
        if (!subject) {
            throw new ApolloError('Subject not found', 'SUBJECT_NOT_FOUND');
        }

        const blockId = subject.block;
        const testIds = subject.tests || [];

        const deleteSubjectPayload = {
            subject: CommonHelper.BuildDeletePayload({
                ids: [subjectId],
                statusKey: 'subject_status',
                timestamp: deletionTimestamp,
                userId
            }),
            block: BuildPullSubjectFromBlockPayload({ subjectId, blockId }),
            tests: null,
            tasks: null,
            studentTestResults: null
        };

        if (!testIds.length) return deleteSubjectPayload;

        const { testPayload, taskIds, studentResultIds } = await CommonHelper.HandleDeleteTests({
            testIds,
            userId,
            timestamp: deletionTimestamp
        });
        deleteSubjectPayload.tests = testPayload;

        if (taskIds.length) {
            deleteSubjectPayload.tasks = CommonHelper.HandleDeleteTasks({
                taskIds,
                userId,
                timestamp: deletionTimestamp
            });
        }

        if (studentResultIds.length) {
            deleteSubjectPayload.studentTestResults = CommonHelper.HandleDeleteStudentTestResults({
                resultIds: studentResultIds,
                userId,
                timestamp: deletionTimestamp
            });
        }

        return deleteSubjectPayload;
    } catch (error) {
        throw new ApolloError(`Failed to build delete subject payload: ${error.message}`, 'GET_DELETE_SUBJECT_PAYLOAD_FAILED', {
            error: error.message
        });
    }
}

/**
 * Builds a payload for removing a subject's ID from a block's 'subjects' array.
 * @param {object} args - The arguments for building the payload.
 * @param {string} args.subjectId - The ID of the subject to remove.
 * @param {string} args.blockId - The ID of the block to update.
 * @returns {object} An object containing 'filter' and 'update' properties for a MongoDB $pull operation.
 */
function BuildPullSubjectFromBlockPayload({ subjectId, blockId }) {
    return {
        filter: { _id: blockId },
        update: { $pull: { subjects: subjectId } }
    };
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetCreateSubjectPayload,
    GetUpdateSubjectPayload,
    GetDeleteSubjectPayload
}