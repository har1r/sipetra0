// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Cek apakah ada Authorization header dan tokennya dimulai dengan "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Ambil tokennya
      token = req.headers.authorization.split(" ")[1];

      // Verifikasi token dan ambil payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Cari user berdasarkan ID dari token
      const user = await User.findById(decoded.id).select("-password");

      // Cek apakah user ada dan aktif
      if (!user || !user.isActive) {
        return res
          .status(401)
          .json({ message: "Akun tidak ditemukan atau dinonaktifkan" });
      }

      // Simpan data user ke request object untuk digunakan di controller selanjutnya
      req.user = user;

      next(); // Lanjut ke controller
    } catch (error) {
      console.error("Auth Error:", error);
      res.status(401).json({ message: "Token tidak valid" });
    }
  } else {
    res.status(401).json({ message: "Akses ditolak, token tidak ditemukan" });
  }
};

module.exports = { protect };
