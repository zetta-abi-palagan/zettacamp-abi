// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { groupBy } = require('lodash');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const StudentModel = require('../student/student.model');

/**
 * Fetches a batch of students based on an array of School IDs.
 * @param {Array<string>} schoolIds - An array of School IDs to fetch students for.
 * @returns {Promise<Array<object|undefined>>} - An array of student objects in the same order as the provided IDs,
 * or an empty array if no students found.
 * @throws {ApolloError} If the batch fetch operation fails.
 */
async function BatchStudents(schoolIds) {
    try {
        const students = await StudentModel.find({
            school_id: {
                $in: schoolIds
            },
            deleted_at: null
        });

        const studentsGroupedBySchoolId = groupBy(students, function (student) {
            return student.school_id.toString();
        });

        return schoolIds.map(function (schoolId) {
            return studentsGroupedBySchoolId[schoolId.toString()] || [];
        });
    } catch (error) {
        console.error("Error batch fetching students:", error);
        throw new ApolloError(`Failed to batch fetch students: ${error.message}`, 'STUDENT_BATCH_FETCH_FAILED');
    }
}

/**
 * Creates and returns a new DataLoader instance for students.
 * @returns {DataLoader} - A new DataLoader instance for batching and caching student lookups.
 */
function StudentLoader() {
    return new DataLoader(function (schoolIds) {
        return BatchStudents(schoolIds);
    });
}

// *************** EXPORT MODULE ***************
module.exports = StudentLoader;