// Load environment variables dari file .env
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

// Import route handler
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Buat instance dari Express
const app = express();

// Hubungkan ke database MongoDB
connectDB();

// Middleware: CORS (Cross-Origin Resource Sharing)
app.use(
  cors({
    origin: process.env.CORS_URL || "*", // Izinkan frontend tertentu (atau semua)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware: parsing body JSON
app.use(express.json());

// (Optional) Middleware: parsing form-data jika diperlukan
// app.use(express.urlencoded({ extended: true }));

// Routes: endpoint utama API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

// Serve static files dari folder 'uploads'
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware fallback jika route tidak ditemukan
app.use((req, res, next) => {
  res.status(404).json({ message: "Route tidak ditemu" });
});

// Middleware global error handler (debug-friendly)
app.use((err, req, res, next) => {
  console.error("❌ Terjadi kesalahan:", err.message);
  console.error(err.stack);

  res.status(500).json({
    message: "Terjadi kesalahan internal server.",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Tentukan port server
const PORT = process.env.PORT || 5000;

// Jalankan server
app.listen(PORT, () => {
  console.log(`✅ Server sedang berjalan di http://localhost:${PORT}`);
});
