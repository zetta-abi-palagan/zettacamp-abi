// *************** IMPORT UTILITES ***************
const BuildDeletePayload = require('./build_delete_payload');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../validator/index');

/**
 * Handles the processing of student test result IDs for deletion and creates the corresponding payload.
 * @param {object} args - The arguments for handling student test result deletion.
 * @param {Array<string>} args.resultIds - An array of student test result IDs to process.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @returns {object} An object containing the 'filter' and 'update' payload for student test results.
 */
function HandleDeleteStudentTestResults({ resultIds, userId, timestamp }) {
    CommonValidator.ValidateObjectIdArray(resultIds, 'INVALID_STUDENT_TEST_RESULT_ID');

    return BuildDeletePayload({
        ids: resultIds,
        statusKey: 'student_test_result_status',
        timestamp,
        userId
    });
}

// *************** EXPORT MODULE ***************
module.exports = HandleDeleteStudentTestResults;