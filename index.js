// *************** IMPORT LIBRARY ***************
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 5000;
const mongo_uri = 'mongodb://localhost:27017/zettacamp';

const connectDB = async () => {
    try {
        await mongoose.connect(mongo_uri);
        console.log('connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error', err.message);
        process.exit(1);
    }
};

const startServer = () => {
    app.listen(port, () => {
        console.log(`server is running on http://localhost:${port}`);
    });
};

const initializeApp = async () => {
    try {
        await connectDB();
        startServer();
    } catch (err) {
        console.error(err);
    }
};

initializeApp();