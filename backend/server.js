require("dotenv").config();

const express = require("express");
const { port, frontendDir } = require("./config");
const db = require("./database");

const app = express();

app.use(express.json());

app.use("/api", require("./routes/content"));
app.use("/api/pooja", require("./routes/pooja"));
app.use("/api/chanda", require("./routes/chanda"));

app.use(express.static(frontendDir));

app.listen(port, () => {
  console.log(`Dasara site running at http://localhost:${port}`);
});