// *************** IMPORT LIBRARY ***************
const dotenv = require('dotenv');

// *************** Load environment variables from .env file
dotenv.config();

const config = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
}

// *************** EXPORT MODULE ***************
module.exports = config;