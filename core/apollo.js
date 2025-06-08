// *************** IMPORT LIBRARY ***************
const { ApolloServer } = require('apollo-server-express');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');

// *************** IMPORT MODULE ***************
const UserModel = require('../modules/user/user.model');
const Student = require('../modules/student/student.model');
const School = require('../modules/school/school.model');
const userTypeDefs = require('../modules/user/user.typedef');
const studentTypeDefs = require('../modules/student/student.typedef');
const schoolTypeDefs = require('../modules/school/school.typedef');
const userResolvers = require('../modules/user/user.resolvers');
const studentResolvers = require('../modules/student/student.resolvers');
const schoolResolvers = require('../modules/school/school.resolvers');
const StudentLoader = require('../modules/school/school.loader');

/**
 * Creates and applies Apollo Server middleware to the Express app.
 * This sets up the /graphql endpoint for handling GraphQL requests.
 * @param {object} app - The Express application instance.
 * @param {number|string} port - The port number the server is running on, for logging purposes.
 * @returns {Promise<void>} A promise that resolves when the Apollo Server is started and applied.
 */
async function SetupApolloServer(app, port) {
    if (!app || typeof app.listen !== 'function') {
        throw new Error("Invalid Express app: .listen method not found.");
    }
    if (!port) {
        console.warn("Port not provided to SetupApolloServer; log message might be incomplete.");
        port = '[UNKNOWN_PORT]';
    }
    const server = new ApolloServer({
        typeDefs: mergeTypeDefs([userTypeDefs, studentTypeDefs, schoolTypeDefs]),
        resolvers: mergeResolvers([userResolvers, studentResolvers, schoolResolvers]),
        context: function () {
            return {
                models: {
                    User: UserModel,
                    Student,
                    School
                },
                dataLoaders: {
                    StudentLoader: StudentLoader()
                }
            }
        }
    });
    await server.start();
    // *************** Apply the GraphQL middleware to the existing Express app with /graphql endpoint
    server.applyMiddleware({ app });
    console.log(`GraphQL server ready at http://localhost:${port}${server.graphqlPath}`);
}

// *************** EXPORT MODULE ***************
module.exports = SetupApolloServer;