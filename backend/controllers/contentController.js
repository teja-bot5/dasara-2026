const fs = require("fs");
const path = require("path");
const { dataDir } = require("../config");

const read = (file) =>
  JSON.parse(
    fs.readFileSync(path.join(dataDir, file), "utf8")
  );

exports.getConfig = (req, res) =>
  res.json(read("config.json"));

exports.getEvents = (req, res) =>
  res.json(read("events.json"));