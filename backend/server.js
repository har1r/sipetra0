require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import route handler
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

/**
 * 1. Koneksi Database
 */
connectDB();

/**
 * 2. Middleware Global
 */
app.use(cors({
  origin: process.env.CORS_URL || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

/**
 * 3. Endpoint API
 * Menggunakan struktur prefix yang konsisten
 */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

/**
 * 4. Error Handling
 */

// Fallback jika route tidak ditemukan
app.use((req, res) => {
  res.status(404).json({ message: "Route tidak ditemukan." });
});

// Global error handler
app.use((error, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";
  
  console.error("❌ Server Error:", error.message);
  if (isDev) console.error(error.stack);

  res.status(500).json({
    message: "Terjadi kesalahan internal server.",
    error: isDev ? error.message : undefined,
  });
});

/**
 * 5. Server Listener
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server berjalan di mode ${process.env.NODE_ENV || 'production'}`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
});