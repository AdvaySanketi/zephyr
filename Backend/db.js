const mysql = require("mysql2");
require("dotenv").config();

function connectToSQL() {
  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  db.connect((err) => {
    if (err) {
      throw err;
    }
    console.log("Connected to database");
  });
  global.db = db;
}

module.exports = connectToSQL;
