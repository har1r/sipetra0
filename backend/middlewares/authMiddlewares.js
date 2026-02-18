const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    // Pastikan header Authorization ada dan formatnya benar
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Akses ditolak, token tidak ditemukan" });
    }

    // Ambil token dari header
    const token = authHeader.split(" ")[1];

    // Verifikasi dan decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Cari user berdasarkan ID dari token
    const user = await User.findById(decoded.id).select("-password");

    // Validasi keberadaan dan status user
    if (!user) {
      return res.status(401).json({ message: "Akun tidak ditemukan" });
    }

    if (user.isActive === false) {
      return res
        .status(403)
        .json({ message: "Akun dinonaktifkan, hubungi admin" });
    }

    // Simpan data user ke request agar bisa diakses controller
    req.user = user;

    next(); // Lanjut ke proses berikutnya
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({
      message:
        error.name === "TokenExpiredError"
          ? "Sesi berakhir, silakan login ulang"
          : "Token tidak valid",
    });
  }
};


module.exports = { protect };
