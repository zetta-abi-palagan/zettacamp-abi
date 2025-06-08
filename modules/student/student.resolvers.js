// *************** IMPORT HELPER FUNCTION *************** 
const {
    GetAllStudents,
    GetOneStudent,
    CreateStudent,
    UpdateStudent,
    DeleteStudent
} = require('./student.helper');

const studentResolvers = {
    Query: {
        GetAllStudents,
        GetOneStudent
    },

    Mutation: {
        CreateStudent,
        UpdateStudent,
        DeleteStudent
    }
};

// *************** EXPORT MODULE ***************
module.exports = studentResolvers;