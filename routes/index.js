/* =========================================================
   LocalCart — index.js
   App entry point. Run with: node index.js  (or npm start)
   ========================================================= */

const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config/database"); // opens the MySQL pool + runs the connection check

const vendorRoutes = require("./routes/vendorRoutes");

const app = express();

app.use(cors());            // allows the frontend (different origin/port) to call this API
app.use(express.json());    // parses JSON request bodies

app.use("/api/vendors", vendorRoutes);

// Basic health check — useful for confirming the server is up
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "LocalCart API is running" });
});

// Catch-all 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`LocalCart API running on http://localhost:${PORT}`);
});