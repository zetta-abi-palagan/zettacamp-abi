// *************** IMPORT CORE ***************
const { ApolloServer } = require('apollo-server-express');

// *************** IMPORT MODULE ***************
const typeDefs = require('./typedef');
const resolvers = require('./resolvers');
const CreateLoaders = require('./loaders');
const UserModel = require('../modules/user/user.model');
const StudentModel = require('../modules/student/student.model');

// *************** IMPORT UTILITIES ***************
const { AuthorizeRequest } = require('../middleware/auth');

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
        typeDefs,
        resolvers,
        context: async ({ req }) => {
            const { user: decodedUser } = AuthorizeRequest(req, req.body);

            let user;

            if (decodedUser && decodedUser._id) {
                if (decodedUser.role === 'STUDENT') {
                    user = await StudentModel.findOne({ _id: decodedUser._id, student_status: 'ACTIVE' }).lean();
                } else {
                    user = UserModel.findOne({ _id: decodedUser._id, user_status: 'ACTIVE' }).lean();
                }
            }
            return {
                dataLoaders: CreateLoaders(),
                user
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