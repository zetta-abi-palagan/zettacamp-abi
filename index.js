// *************** IMPORT LIBRARY ***************
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// *************** Load environment variables from .env file
dotenv.config();

// *************** Initialize Express application
const app = express();

// *************** Calling the environment variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

/**
 * Establishes a connection to the MongoDB database.
 * The function will terminate the application process if the MONGO_URI is not defined
 * or if the connection to MongoDB fails.
 * @async
 * @function ConnectDB
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
 * @function StartServer
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
 * @function InitializeApp
 * @returns {Promise<void>} A promise that resolves if all initialization steps are successful.
 * The application will log success or terminate on any critical failure.
 */
async function InitializeApp() {
    // *************** START: Application initialization sequence ***************
    try {
        await ConnectDB();
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
