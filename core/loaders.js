// *************** IMPORT MODULE ***************
const UserLoader = require('../modules/user/user.loader');
const StudentLoader = require('../modules/student/student.loader');
const SchoolLoader = require('../modules/school/school.loader');

/**
 * Creates the context for a GraphQL request.
 * This function initializes and returns an object containing all the DataLoader
 * instances, making them available to all resolvers. This ensures that
 * data loading can be batched and cached per-request.
 * @returns {object} The context object for a GraphQL request.
 */
function CreateContext() {
    return {
        dataLoaders: {
            UserLoader: UserLoader(),
            StudentLoader: StudentLoader(),
            SchoolLoader: SchoolLoader()
        }
    };
}

// *************** EXPORT MODULE ***************
module.exports = CreateContext;