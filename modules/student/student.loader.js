// *************** IMPORT LIBRARY ***************
const DataLoader = require('dataloader');
const { groupBy } = require('lodash');
const { ApolloError } = require('apollo-server');

// *************** IMPORT MODULE ***************
const StudentModel = require('./student.model');

/**
 * Creates a new DataLoader for batch-loading active students for multiple schools.
 * This function is used to solve the N+1 problem by grouping requests for students
 * by their school ID and fetching them in a single database query.
 * @returns {DataLoader} - An instance of DataLoader for fetching arrays of students by school ID.
 */
function StudentLoader() {
    return new DataLoader(async function (schoolIds) {
        try {
            const students = await StudentModel.find({
                school: {
                    $in: schoolIds,
                },
                student_status: 'ACTIVE'
            });

            const studentsGroupedBySchoolId = groupBy(students, function (student) {
                return student.school.toString();
            });

            return schoolIds.map(function (schoolId) {
                return studentsGroupedBySchoolId[schoolId.toString()] || [];
            });
        } catch (error) {
            console.error("Error batch fetching students:", error);
            throw new ApolloError(`Failed to batch fetch students: ${error.message}`, 'STUDENT_BATCH_FETCH_FAILED');
        }
    })
}

// *************** EXPORT MODULE ***************
module.exports = StudentLoader;