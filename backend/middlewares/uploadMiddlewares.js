const multer = require("multer");
const path = require("path");

// Gunakan memoryStorage agar kompatibel dengan Vercel serverless
// (filesystem Vercel bersifat read-only dan ephemeral)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Untuk Report/Batch, biasanya kita hanya butuh PDF
  const allowedTypes = ["application/pdf"]; 
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file PDF yang diizinkan untuk laporan!"), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Tingkatkan ke 10MB jika PDF batch sering berisi banyak halaman
});

module.exports = upload;