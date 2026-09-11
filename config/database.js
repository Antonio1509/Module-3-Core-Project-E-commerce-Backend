/* =========================================================
   LocalCart — config/database.js
   Creates one shared MySQL connection pool for the whole app.
   A pool (not a single connection) is used so multiple
   requests can query the database concurrently without
   waiting on each other.
   ========================================================= */

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "localcart",
  waitForConnections: true,
  connectionLimit: 10,   // max simultaneous connections in the pool
  queueLimit: 0
});

// Quick sanity check when the server boots — fails loudly and
// early if the .env credentials or MySQL service are wrong,
// instead of surfacing as a confusing error on the first request.
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected:", process.env.DB_NAME || "localcart");
    conn.release();
  } catch (err) {
  console.error("❌ MySQL connection failed:", err);
  }
}

testConnection();

module.exports = pool;