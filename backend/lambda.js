const serverless = require('serverless-http');
const app = require('./index');
const connectDB = require('./config/db');

// Connect to database outside of handler to take advantage of warm starts
connectDB();

module.exports.handler = serverless(app);
