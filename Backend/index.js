const connectToSQL = require("./db");
const express = require("express");
const cors = require("cors");

connectToSQL();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/exchange", require("./routes/exchange"));
app.use("/api/token", require("./routes/token"));

app.get("/api/test", (req, res) => {
  res.send("Backend is working!");
});

app.listen(5000, () => {
  console.log(`zephyr-backend listening on port 5000`);
});

module.exports = app;
