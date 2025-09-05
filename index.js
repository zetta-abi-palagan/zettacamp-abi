// *************** IMPORT MODULE ***************
const config = require('./core/config');
const ConnectDB = require('./core/database');
const SetupApolloServer = require('./core/apollo');
const { InitializeExpressApp, StartExpressServer } = require('./core/express');

const port = config.PORT;

/**
 * Initializes and starts the entire application.
 * This function orchestrates database connection, Express app setup, Apollo Server setup,
 * and starts the HTTP server.
 * It will terminate the application process if any critical step fails.
 */
async function StartApp() {
  try {
    const app = InitializeExpressApp();
    console.log('Express app initialized.');

    // *************** Connecting to the MongoDB
    await ConnectDB();

    // *************** Setting up the Apollo server
    await SetupApolloServer(app, port);

    // *************** Starting the Express server
    await StartExpressServer(app, port);
    console.log('Application initialized successfully.');
  } catch (err) {
    console.error('Application initialization failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// *************** Start the application
StartApp();
