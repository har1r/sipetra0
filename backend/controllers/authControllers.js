const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Ganti path sesuai struktur kamu

/* ======================================================
   🔐 Helper: Generate JWT Token
====================================================== */
const generateToken = (userId, userRole) => {
  return jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

/* ======================================================
   🧩 Controller: Register User Baru
   - Validasi input
   - Cek duplikasi email
   - Validasi role sesuai schema
   - Hash password
   - Simpan ke database
====================================================== */
const registerUser = async (req, res) => {
  try {
    // 1️⃣ Ambil data dari body
    const { name, email, password, role, adminInviteToken } = req.body;

    // 2️⃣ Validasi field wajib
    if (!name?.trim() || !email?.trim() || !password?.trim() || !role?.trim()) {
      return res.status(400).json({
        message: "Nama, email, password, dan role wajib diisi.",
      });
    }

    // 3️⃣ Normalisasi email
    const normalizedEmail = email.toLowerCase().trim();

    // 4️⃣ Cek apakah user sudah ada
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar." });
    }

    // 5️⃣ Validasi role sesuai enum model User
    const allowedRoles = [
      "admin",
      "penginput",
      "penata",
      "peneliti",
      "pengarsip",
      "pengirim",
      "pengecek",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Role tidak valid." });
    }

    // 6️⃣ Validasi khusus untuk admin
    if (role === "admin") {
      if (
        !adminInviteToken ||
        adminInviteToken !== process.env.ADMIN_INVITE_TOKEN
      ) {
        return res
          .status(403)
          .json({ message: "Token undangan admin tidak valid." });
      }
    }

    // 7️⃣ Enkripsi password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 8️⃣ Simpan user baru
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    // 9️⃣ Siapkan token dan response
    const token = generateToken(newUser._id, newUser.role);

    return res.status(201).json({
      message: "Registrasi berhasil.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Gagal register user:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// // Fungsi untuk membuat JWT token
// const generateToken = (userId, userRole) => {
//   return jwt.sign({ id: userId, role: userRole }, process.env.JWT_SECRET, {
//     expiresIn: "7d",
//   });
// };

// // @desc    Register user baru
// // @route   POST /api/auth/register
// // @access  Public
// const registerUser = async (req, res) => {
//   try {
//     // Ambil data dari body request
//     const { name, email, password, role, profileImageUrl, adminInviteToken } =
//       req.body;

//     // Validasi field wajib
//     if (!name || !email || !password || !role) {
//       return res.status(400).json({ message: "Semua field wajib diisi" });
//     }

//     // Pastikan email lowercase agar unik & konsisten
//     const emailToCheck = email.toLowerCase();

//     // Cek apakah email sudah terdaftar
//     const userExists = await User.findOne({ email: emailToCheck });
//     if (userExists) {
//       return res.status(400).json({ message: "Email sudah terdaftar" });
//     }

//     // Daftar role yang diperbolehkan
//     const allowedRoles = [
//       "admin",
//       "penginput",
//       "penata",
//       "peneliti",
//       "pengarsip",
//       "pengirim",
//     ];

//     // Validasi role
//     if (!allowedRoles.includes(role)) {
//       return res.status(400).json({ message: "Role tidak valid" });
//     }

//     // Jika role admin, validasi token undangan admin
//     if (role === "admin") {
//       if (
//         !adminInviteToken ||
//         adminInviteToken !== process.env.ADMIN_INVITE_TOKEN
//       ) {
//         return res.status(403).json({ message: "Token admin tidak valid" });
//       }
//     }

//     // Enkripsi password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Buat user baru
//     const user = await User.create({
//       name,
//       email: emailToCheck,
//       password: hashedPassword,
//       role,
//       profileImageUrl,
//     });

//     // Respon sukses
//     res.status(201).json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       profileImageUrl: user.profileImageUrl,
//       token: generateToken(user._id, user.role),
//     });
//   } catch (error) {
//     console.error("❌ Gagal register user:", error.message);
//     res.status(500).json({
//       message: "Terjadi kesalahan server",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

/* ======================================================
   🔑 Controller: Login User
   - Validasi input
   - Cek keberadaan user
   - Bandingkan password
   - Kembalikan data user & JWT token
====================================================== */
const loginUser = async (req, res) => {
  try {
    // 1️⃣ Ambil input dari body
    const { email, password } = req.body;

    // 2️⃣ Validasi input
    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({
        message: "Email dan password wajib diisi.",
      });
    }

    // 3️⃣ Normalisasi email
    const normalizedEmail = email.toLowerCase().trim();

    // 4️⃣ Cari user berdasarkan email
    const user = await User.findOne({ email: normalizedEmail });

    // 5️⃣ Cek apakah user ditemukan dan password cocok
    const isPasswordValid =
      user && (await bcrypt.compare(password, user.password));
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email atau password salah.",
      });
    }

    // 6️⃣ Buat token JWT
    const token = generateToken(user._id, user.role);

    // 7️⃣ Kirim respons sukses
    return res.status(200).json({
      message: "Login berhasil.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
      lastLogin: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gagal login:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Validasi input
//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email dan password wajib diisi" });
//     }

//     // Cari user berdasarkan email (dengan lowercase)
//     const user = await User.findOne({ email: email.toLowerCase() });

//     // Jika user tidak ditemukan atau password tidak cocok
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ message: "Email atau password salah" });
//     }

//     // Jika user tidak aktif (isActive = false)
//     if (!user.isActive) {
//       return res.status(403).json({ message: "Akun Anda telah dinonaktifkan" });
//     }

//     // Kirim data user dan token JWT
//     res.status(200).json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       profileImageUrl: user.profileImageUrl,
//       token: generateToken(user._id, user.role),
//       lastLogin: Date.now(),
//     });
//   } catch (error) {
//     console.error("❌ Gagal login:", error.message);
//     res.status(500).json({
//       message: "Terjadi kesalahan server",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

/* ======================================================
   👤 Controller: Get User Profile
   - Hanya untuk user yang sudah login
   - Data user diambil dari req.user (middleware protect)
   - Password disembunyikan
====================================================== */
const getUserProfile = async (req, res) => {
  try {
    // 1️⃣ Ambil ID user dari token (diset oleh middleware protect)
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: "Akses tidak sah. Token tidak valid atau hilang.",
      });
    }

    // 2️⃣ Ambil data user tanpa password
    const user = await User.findById(userId).select("-password").lean(); // lean() → hasil plain object, bukan mongoose doc

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan.",
      });
    }

    // 3️⃣ Kirim respons sukses
    return res.status(200).json({
      message: "Profil user berhasil diambil.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get User Profile Error:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
// @desc    Ambil profil user yang sedang login
// @route   GET /api/auth/profile
// @access  Private
// const getUserProfile = async (req, res) => {
//   try {
//     // req.user didapat dari middleware protect
//     const user = await User.findById(req.user._id).select("-password").lean();

//     if (!user) {
//       return res.status(404).json({ message: "User tidak ditemukan" });
//     }

//     res.status(200).json(user);
//   } catch (error) {
//     console.error("❌ Get User Profile Error:", error);
//     res.status(500).json({
//       message: "Terjadi kesalahan server",
//       error: process.env.NODE_ENV === "development" ? error.message : undefined,
//     });
//   }
// };

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
