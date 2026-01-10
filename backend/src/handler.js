// src/handler.js
const serverless = require("serverless-http");
const app = require("./app");
const mongoose = require("mongoose");

let isConnected = false;

module.exports.handler = async (event, context) => {
  if (!isConnected) {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
  }
  return serverless(app)(event, context);
};
