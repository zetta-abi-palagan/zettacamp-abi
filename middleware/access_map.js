// *************** IMPORT LIBRARY ***************
const { ForbiddenError } = require('apollo-server-express');

/**
 * A validator function to check if the authenticated user owns the requested resource.
 * It compares the user's ID with the ID present in the GraphQL variables.
 * @param {object} args - The arguments for the validation.
 * @param {object} args.user - The authenticated user object from the context.
 * @param {object} args.variables - The variables from the GraphQL request.
 * @returns {boolean} - Returns true if the validation passes.
 */
function IsOwnedByStudent({ user, variables }) {
    const resourceId = variables.id || variables.studentId;
    if (!resourceId || String(user._id) !== String(resourceId)) {
        throw new ForbiddenError('You are not authorized to access this resource.');
    }
};

const accessMap = {
    QUERY: {
        // *************** User Queries 
        GetAllUsers: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        GetOneUser: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        GetAllUsersWithFilter: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },

        // *************** School Queries 
        GetAllSchools: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        GetOneSchool: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR', 'STUDENT'] },
        GetAllSchoolsWithFilter: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },

        // *************** Student Queries 
        GetAllStudents: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        GetOneStudent: {
            roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'STUDENT'],
            validator: IsOwnedByStudent
        },
        GetAllStudentsWithFilter: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },

        // *************** Academic Structure Queries
        GetAllBlocks: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR', 'STUDENT'] },
        GetOneBlock: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR', 'STUDENT'] },
        GetAllSubjects: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR', 'STUDENT'] },
        GetOneSubject: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR', 'STUDENT'] },
        GetAllTests: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR', 'STUDENT'] },
        GetOneTest: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR', 'STUDENT'] },

        // *************** Result & Task Queries
        GetAllStudentTestResults: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR'] },
        GetOneStudentTestResult: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR'] },
        GetAllTasks: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR'] },
        GetOneTask: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'CORRECTOR'] },
        GetFinalTranscriptResult: {
            roles: ['ADMIN', 'ACADEMIC_DIRECTOR', 'STUDENT'],
            validator: IsOwnedByStudent
        },
    },
    MUTATION: {
        // *************** User Mutations
        CreateUser: { roles: ['ADMIN'] },
        UpdateUser: { roles: ['ADMIN'] },
        DeleteUser: { roles: ['ADMIN'] },

        // *************** School & Student Mutations
        CreateSchool: { roles: ['ADMIN'] },
        UpdateSchool: { roles: ['ADMIN'] },
        DeleteSchool: { roles: ['ADMIN'] },
        CreateStudent: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        UpdateStudent: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        DeleteStudent: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },

        // *************** Academic Structure Mutations
        CreateBlock: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        UpdateBlock: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        DeleteBlock: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        CreateSubject: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        UpdateSubject: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        DeleteSubject: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        CreateTest: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        UpdateTest: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        DeleteTest: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        PublishTest: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },

        // *************** Task & Result Mutations 
        UpdateStudentTestResult: { roles: ['ADMIN', 'CORRECTOR', 'ACADEMIC_DIRECTOR'] },
        DeleteStudentTestResult: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        CreateTask: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        UpdateTask: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        DeleteTask: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
        AssignCorrector: { roles: ['ACADEMIC_DIRECTOR'] },
        EnterMarks: { roles: ['ADMIN', 'CORRECTOR'] },
        ValidateMarks: { roles: ['ADMIN', 'ACADEMIC_DIRECTOR'] },
    }
};

// *************** EXPORT MODULE ***************s
module.exports = accessMap;