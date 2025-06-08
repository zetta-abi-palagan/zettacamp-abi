// *************** IMPORT HELPER FUNCTION *************** 
const {
    GetAllSchools,
    GetOneSchool,
    CreateSchool,
    UpdateSchool,
    DeleteSchool,
    ResolveStudents
} = require('./school.helper');

const schoolResolvers = {
    Query: {
        GetAllSchools,
        GetOneSchool
    },

    Mutation: {
        CreateSchool,
        UpdateSchool,
        DeleteSchool
    },

    School: {
        students: ResolveStudents
    }
};

// *************** EXPORT MODULE ***************
module.exports = schoolResolvers;