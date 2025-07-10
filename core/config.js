// *************** IMPORT LIBRARY ***************
const dotenv = require('dotenv');

// *************** Load environment variables from .env file
dotenv.config();

const config = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    SENDGRID_SENDER_EMAIL: process.env.SENDGRID_SENDER_EMAIL,
    BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION
}

// *************** EXPORT MODULE ***************
module.exports = config;