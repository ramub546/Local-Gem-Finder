// backend/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// ✅ Only keep ONE static files declaration
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database connection
const pool = require("./db");

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const profileRoutes = require("./routes/profile");
app.use("/api/profile", profileRoutes);

const placesRoutes = require("./routes/places");
app.use("/api/places", placesRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});