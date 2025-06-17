// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const SubjectModel = require('./subject.model');

/**
 * Creates a new DataLoader for batch-loading active subject data by their IDs.
 * This function is used to solve the N+1 problem by collecting individual subject ID
 * requests and fetching them in a single database query.
 * @returns {DataLoader} - An instance of DataLoader for fetching subjects by their unique ID.
 */
function SubjectLoader() {
    return new DataLoader(async (subjectIds) => {
        try {
            const subjects = await SubjectModel.find({
                _id: { $in: subjectIds },
                subject_status: 'ACTIVE',
            });

            const subjectsById = new Map(subjects.map(subject => [String(subject._id), subject]));

            return subjectIds.map(subjectId => subjectsById.get(String(subjectId)) || null);
        } catch (error) {
            console.error("Error batch fetching subjects:", error);
            throw new ApolloError(`Failed to batch fetch subjects: ${error.message}`, 'SUBJECT_BATCH_FETCH_FAILED');
        }
    });
}

// *************** EXPORT MODULE ***************
module.exports = SubjectLoader;