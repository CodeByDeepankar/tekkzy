// src/handler.js
const serverless = require("serverless-http");
const app = require("./app");

module.exports.handler = async (event, context) => {
  return serverless(app)(event, context);
};
