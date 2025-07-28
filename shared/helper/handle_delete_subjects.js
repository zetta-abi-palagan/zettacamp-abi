// *************** IMPORT LIBRARY ***************
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const SubjectModel = require('../../modules/subject/subject.model');

// *************** IMPORT UTILITES ***************
const BuildDeletePayload = require('./build_delete_payload');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../validator/index');

/**
 * Handles the processing of subject IDs for deletion, creating a payload and collecting descendant test IDs.
 * @param {object} args - The arguments for handling subject deletion.
 * @param {Array<string>} args.subjectIds - An array of subject IDs to process.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @returns {Promise<object>} A promise that resolves to an object containing the subject delete payload and an array of test IDs.
 */
async function HandleDeleteSubjects({ subjectIds, userId, timestamp }) {
  try {
    CommonValidator.ValidateObjectIdArray(subjectIds, 'INVALID_SUBJECT_ID');

    const subjects = await SubjectModel.find({ _id: { $in: subjectIds } });

    if (!subjects.length) {
      throw new ApolloError('No matching subjects found', 'SUBJECTS_NOT_FOUND');
    }

    const testIds = [].concat(...subjects.map((subject) => subject.tests || []));

    const subjectPayload = BuildDeletePayload({
      ids: subjectIds,
      statusKey: 'subject_status',
      timestamp,
      userId,
    });

    return { subjectPayload, testIds };
  } catch (error) {
    throw new ApolloError(`Failed to handle delete subjects: ${error.message}`, 'HANDLE_DELETE_SUBJECTS_FAILED', {
      error: error.message,
    });
  }
}

// *************** EXPORT MODULE ***************
module.exports = HandleDeleteSubjects;
