// *************** IMPORT CORE ***************
const express = require('express');

// *************** IMPORT MODULE ***************
const finalTranscriptResultRouter = require('../modules/finalTranscriptResult/final_transcript_result.router');

/**
 * Initializes and configures the Express application.
 * @returns {object} The configured Express app instance.
 */
function InitializeExpressApp() {
    const app = express();

    // *************** Endpoint for checking if the server is up
    app.get('/health', function (req, res) {
        res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
    })

    app.use('/api', finalTranscriptResultRouter);

    return app;
}

/**
 * Starts the Express server and listens for incoming requests on the configured PORT.
 * The function will terminate the application process if it fails to start the server.
 * @param {object} app - The Express application instance.
 * @param {number|string} port - The port number to listen on.
 * @returns {Promise<void>} A promise that resolves when the server has started listening.
 */
async function StartExpressServer(app, port) {
    if (!app || typeof app.listen !== 'function') {
        throw new Error("Invalid Express app: .listen method not found.");
    }
    if (!port) {
        console.warn("Port not provided; defaulting to 5000");
        port = 5000;
    }

    return new Promise(function(resolve, reject) {
        const server = app.listen(port, function() {
            console.log(`Server is running on http://localhost:${port}`);
            resolve(server);
        });

        server.on('error', function(err) {
            console.error('Failed to start server:', err.message);
            reject(err);
        });
    });
}

// *************** EXPORT MODULE ***************
module.exports = { InitializeExpressApp, StartExpressServer };