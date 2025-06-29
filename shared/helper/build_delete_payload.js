/**
 * A generic utility to build a standard soft-delete payload object.
 * @param {object} args - The arguments for building the payload.
 * @param {Array<string>} args.ids - An array of document IDs to target.
 * @param {string} args.statusKey - The name of the status field to be updated (e.g., 'subject_status').
 * @param {number} args.timestamp - The timestamp of the deletion.
 * @param {string} args.userId - The ID of the user performing the deletion.
 * @returns {object} An object containing 'filter' and 'update' properties for a database operation.
 */
function BuildDeletePayload({ ids, statusKey, timestamp, userId }) {
    return {
        filter: { _id: { $in: ids } },
        update: {
            [statusKey]: 'DELETED',
            updated_by: userId,
            deleted_by: userId,
            deleted_at: timestamp
        }
    };
}

// *************** EXPORT MODULE ***************
module.exports = BuildDeletePayload;