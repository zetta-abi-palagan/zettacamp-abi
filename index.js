// *************** IMPORT LIBRARY ***************
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { ApolloServer } = require('apollo-server-express');
const { mergeTypeDefs } = require('@graphql-tools/merge');
const { mergeResolvers } = require('@graphql-tools/merge');

// *************** IMPORT CORE ***************
const scalarsTypeDefs = require('./scalars/scalars.typedef');
const userTypeDefs = require('./modules/user/user.typedef');
const studentTypeDefs = require('./modules/student/student.typedef');
const schoolTypeDefs = require('./modules/school/school.typedef');
const dateScalar = require('./scalars/date_scalar');
const userResolvers = require('./modules/user/user.resolvers');
const studentResolvers = require('./modules/student/student.resolvers');
const schoolResolvers = require('./modules/school/school.resolvers');

// *************** Load environment variables from .env file
dotenv.config();

// *************** Initialize Express application
const app = express();

// *************** Calling the environment variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

/**
 * Creates and applies Apollo Server middleware to the Express app.
 * This sets up the /graphql endpoint for handling GraphQL requests.
 * @async
 * @returns {Promise<void>} A promise that resolves when the Apollo Server is started and applied.
 */
async function SetupApolloServer() {
    const server = new ApolloServer({
        typeDefs: mergeTypeDefs([scalarsTypeDefs, userTypeDefs, studentTypeDefs, schoolTypeDefs]),
        resolvers: mergeResolvers([{ Date: dateScalar }, userResolvers, studentResolvers, schoolResolvers])
    });
    await server.start();

    // *************** Apply the GraphQL middleware to the existing Express app with /graphql endpoint
    server.applyMiddleware({ app });
    console.log(`GraphQL server ready at http://localhost:${PORT}${server.graphqlPath}`);
}

/**
 * Establishes a connection to the MongoDB database.
 * The function will terminate the application process if the MONGO_URI is not defined
 * or if the connection to MongoDB fails.
 * @async
 * @returns {Promise<void>} A promise that resolves if the connection is successful.
 * However, the primary outcomes are either a successful connection
 * log or process termination on error.
 */
async function ConnectDB() {
    // *************** START: Sanity check for MONGO_URI ***************
    if (!MONGO_URI) {
        console.error('MongoDB connection error: MONGO_URI is not defined in environment variables.');
        process.exit(1);
    }
    // *************** END: Sanity check for MONGO_URI ***************

    // *************** START: Database connection attempt ***************
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Successfully connected to MongoDB.');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
    // *************** END: Database connection attempt ***************
}

/**
 * Starts the Express server and listens for incoming requests on the configured PORT.
 * The function will terminate the application process if it fails to start the server.
 * @async
 * @returns {Promise<void>} A promise that resolves when the server has started listening.
 * In practice, `app.listen` initiates an asynchronous operation;
 * this function logs success or terminates on error.
 */
async function StartServer() {
    // *************** START: Server listening attempt ***************
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
    // *************** END: Server listening attempt ***************
}

/**
 * Initializes the application by performing critical startup tasks:
 * 1. Connecting to the MongoDB database.
 * 2. Starting the Express HTTP server.
 * The function will terminate the application process if any of these steps fail.
 * @async
 * @returns {Promise<void>} A promise that resolves if all initialization steps are successful.
 * The application will log success or terminate on any critical failure.
 */
async function InitializeApp() {
    // *************** START: Application initialization sequence ***************
    try {
        await ConnectDB();
        await SetupApolloServer();
        await StartServer();
        console.log('Application initialized successfully.');
    } catch (err) {
        console.error('Application initialization failed:', err.message);
        process.exit(1);
    }
    // *************** END: Application initialization sequence ***************
}

// *************** Start the application
InitializeApp();
