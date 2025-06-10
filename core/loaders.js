// *************** IMPORT MODULE ***************
const UserLoader = require('../modules/user/user.loader');
const StudentLoader = require('../modules/student/student.loader');
const SchoolLoader = require('../modules/school/school.loader');

/**
 * Creates and returns an object containing all DataLoader instances.
 * This function centralizes the instantiation of all data loaders, which can then be
 * added to the GraphQL context for each request.
 * @returns {object} An object with initialized DataLoader instances for User, Student, and School.
 */
function CreateLoaders() {
    return {
        UserLoader: UserLoader(),
        StudentLoader: StudentLoader(),
        SchoolLoader: SchoolLoader()
    };
}

// *************** EXPORT MODULE ***************
module.exports = CreateLoaders;