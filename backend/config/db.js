const mongoose = require('mongoose');

let conn = null;

const connectDB = async () => {
    // If connection is already established, reuse it (Lambda Warm Start)
    if (conn !== null) {
        return conn;
    }

    try {
        conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // Fail fast if DB is down
        });
        console.log('MongoDB Connected');
        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

module.exports = connectDB;
