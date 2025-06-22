// *************** IMPORT CORE ***************
const mongoose = require('mongoose');

// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE *************** 
const SubjectModel = require('./subject.model');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../../shared/validator/index');

/**
 * Creates a clean data payload for a new subject.
 * @param {object} subjectInput - The raw input object containing the subject's properties.
 * @param {boolean} isTransversal - A flag indicating if the subject is transversal.
 * @param {string} userId - The ID of the user creating the subject.
 * @returns {object} A processed data payload suitable for a create operation.
 */
function GetCreateSubjectPayload(subjectInput, isTransversal, userId) {
    CommonValidator.ValidateInputTypeObject(subjectInput);
    CommonValidator.ValidateObjectId(userId);

    const {
        name,
        description,
        coefficient,
        subject_status
    } = subjectInput;

    return {
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
 * Creates a clean data payload for updating an existing subject.
 * @param {object} subjectInput - The raw input object containing the subject's properties to update.
 * @param {string} userId - The ID of the user updating the subject.
 * @returns {object} A processed data payload suitable for an update operation.
 */
function GetUpdateSubjectPayload(subjectInput, userId) {
    CommonValidator.ValidateInputTypeObject(subjectInput);
    CommonValidator.ValidateObjectId(userId);

    const {
        name,
        description,
        coefficient,
        connected_blocks,
        subject_status
    } = subjectInput;

    return {
        name,
        description,
        coefficient,
        connected_blocks,
        subject_status: subject_status.toUpperCase(),
        updated_by: userId
    };
}

/**
 * Generates a payload for a deep, cascading soft delete of a subject and all its descendants.
 * This includes the subject itself, its tests, and those tests' tasks and student results.
 * @param {string} subjectId - The unique identifier of the root subject to be deleted.
 * @param {string} userId - The ID of the user performing the deletion.
 * @returns {Promise<object>} A promise that resolves to a structured payload for all required delete operations.
 */
async function GetDeleteSubjectPayload(subjectId, userId) {
    CommonValidator.ValidateObjectId(subjectId);

    const deletionTimestamp = Date.now();

    const subject = await SubjectModel.findById(subjectId);
    if (!subject) {
        throw new ApolloError('Subject not found', 'SUBJECT_NOT_FOUND');
    }

    const testIds = subject.tests || [];

    // *************** Build subject and block deletion payload
    const deleteSubjectPayload = {
        subject: {
            filter: { _id: subjectId },
            update: {
                subject_status: 'DELETED',
                updated_by: userId,
                deleted_by: userId,
                deleted_at: deletionTimestamp
            }
        },
        block: {
            filter: { subjects: { $in: [subjectId] } },
            update: { $pull: { subjects: subjectId } }
        },
        tests: null,
        tasks: null,
        studentTestResults: null
    };

    // *************** Handle tests
    if (testIds.length) {
        const areAllTestIdsValid = testIds.every(id => mongoose.Types.ObjectId.isValid(id));
        if (!areAllTestIdsValid) {
            throw new ApolloError('One or more test IDs are invalid', 'INVALID_TEST_ID');
        }

        const tests = await TestModel.find({ _id: { $in: testIds } });

        const allTaskIds = [].concat(...tests.map(test => test.tasks || []));
        const allStudentResultIds = [].concat(...tests.map(test => test.student_test_results || []));

        deleteSubjectPayload.tests = {
            filter: { _id: { $in: testIds } },
            update: {
                test_status: 'DELETED',
                updated_by: userId,
                deleted_by: userId,
                deleted_at: deletionTimestamp
            }
        };

        // *************** Handle tasks
        if (allTaskIds.length) {
            const areAllTaskIdsValid = allTaskIds.every(id => mongoose.Types.ObjectId.isValid(id));
            if (!areAllTaskIdsValid) {
                throw new ApolloError('One or more task IDs are invalid', 'INVALID_TASK_ID');
            }

            deleteSubjectPayload.tasks = {
                filter: { _id: { $in: allTaskIds } },
                update: {
                    task_status: 'DELETED',
                    updated_by: userId,
                    deleted_by: userId,
                    deleted_at: deletionTimestamp
                }
            };
        }

        // *************** Handle student test results
        if (allStudentResultIds.length) {
            const areAllStudentResultIdsValid = allStudentResultIds.every(id => mongoose.Types.ObjectId.isValid(id));
            if (!areAllStudentResultIdsValid) {
                throw new ApolloError('One or more student test result IDs are invalid', 'INVALID_STUDENT_TEST_RESULT_ID');
            }

            deleteSubjectPayload.studentTestResults = {
                filter: { _id: { $in: allStudentResultIds } },
                update: {
                    result_status: 'DELETED',
                    updated_by: userId,
                    deleted_by: userId,
                    deleted_at: deletionTimestamp
                }
            };
        }
    }

    return deleteSubjectPayload;
}

// *************** EXPORT MODULE ***************
module.exports = {
    GetCreateSubjectPayload,
    GetUpdateSubjectPayload,
    GetDeleteSubjectPayload
}