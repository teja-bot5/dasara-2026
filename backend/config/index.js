require("dotenv").config();
const path = require("path");

module.exports = {
  port: process.env.PORT || 3000,
  dataDir: path.join(__dirname, "../../data"),
  frontendDir: path.join(__dirname, "../../frontend"),
};