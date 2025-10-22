const User = require("../models/User");

// @Deskripsi: Mengambil semua user
// @Route: GET /api/users
// @Access: Private (hanya admin)
const getAllUsers = async (req, res) => {
  try {
    const requester = req.user;

    // Hanya admin yang boleh akses
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Akses ditolak. Hanya admin yang bisa mengakses." });
    }

    // Ambil semua user, kecuali admin (opsional)
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-password") // Jangan kirim password
      .sort({ name: 1 }); // Urutkan berdasarkan nama

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data user.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
};
