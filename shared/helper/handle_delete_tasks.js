// *************** IMPORT UTILITES ***************
const BuildDeletePayload = require('./build_delete_payload');

// *************** IMPORT VALIDATOR ***************
const CommonValidator = require('../validator/index');

/**
 * Handles the processing of task IDs for deletion and creates the corresponding payload.
 * @param {object} args - The arguments for handling task deletion.
 * @param {Array<string>} args.taskIds - An array of task IDs to process.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @returns {object} An object containing the 'filter' and 'update' payload for tasks.
 */
function HandleDeleteTasks({ taskIds, userId, timestamp }) {
    CommonValidator.ValidateObjectIdArray(taskIds, 'INVALID_TASK_ID');

    return BuildDeletePayload({
        ids: taskIds,
        statusKey: 'task_status',
        timestamp,
        userId
    });
}

// *************** EXPORT MODULE ***************
module.exports = HandleDeleteTasks;