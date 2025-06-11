// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const StudentModel = require('./student.model');

/**
 * Creates a new DataLoader for batch-loading active student data by their IDs.
 * This function is used to solve the N+1 problem by collecting individual student ID
 * requests and fetching them in a single database query.
 * @returns {DataLoader} - An instance of DataLoader for fetching students by their unique ID.
 */
function StudentLoader() {
    return new DataLoader(async (studentIds) => {
        try {
            const students = await StudentModel.find({
                _id: { $in: studentIds },
                student_status: 'ACTIVE',
            });

            const studentsById = new Map(students.map(student => [String(student._id), student]));

            return studentIds.map(studentId => studentsById.get(String(studentId)) || null);
        } catch (error) {
            console.error("Error batch fetching students:", error);
            throw new ApolloError(`Failed to batch fetch students: ${error.message}`, 'STUDENT_BATCH_FETCH_FAILED');
        }
    });
}

// *************** EXPORT MODULE ***************
module.exports = StudentLoader;