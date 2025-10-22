const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Ganti path sesuai struktur kamu

// Fungsi untuk membuat JWT token
const generateToken = (userId, userRole) => {
  return jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// @desc    Register user baru
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    // Ambil data dari body request
    const { name, email, password, role, profileImageUrl, adminInviteToken } = req.body;

    // Validasi field wajib
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    // Pastikan email lowercase agar unik & konsisten
    const emailToCheck = email.toLowerCase();

    // Cek apakah email sudah terdaftar
    const userExists = await User.findOne({ email: emailToCheck });
    if (userExists) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Daftar role yang diperbolehkan
    const allowedRoles = [
      "admin", "penginput", "penata", "peneliti", "pengarsip", "pengirim"
    ];

    // Validasi role
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Role tidak valid" });
    }

    // Jika role admin, validasi token undangan admin
    if (role === "admin") {
      if (!adminInviteToken || adminInviteToken !== process.env.ADMIN_INVITE_TOKEN) {
        return res.status(403).json({ message: "Token admin tidak valid" });
      }
    }

    // Enkripsi password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buat user baru
    const user = await User.create({
      name,
      email: emailToCheck,
      password: hashedPassword,
      role,
      profileImageUrl,
    });

    // Respon sukses
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id, user.role),
    });

  } catch (error) {
    console.error("❌ Gagal register user:", error.message);
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({ message: "Email dan password wajib diisi" });
    }

    // Cari user berdasarkan email (dengan lowercase)
    const user = await User.findOne({ email: email.toLowerCase() });

    // Jika user tidak ditemukan atau password tidak cocok
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // Jika user tidak aktif (isActive = false)
    if (!user.isActive) {
      return res.status(403).json({ message: "Akun Anda telah dinonaktifkan" });
    }

    // Kirim data user dan token JWT
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id, user.role),
      lastLogin: Date.now(),
    });

  } catch (error) {
    console.error("❌ Gagal login:", error.message);
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Ambil profil user yang sedang login
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    // req.user didapat dari middleware protect
    const user = await User.findById(req.user._id).select("-password").lean();

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Get User Profile Error:", error);
    res.status(500).json({
      message: "Terjadi kesalahan server",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
