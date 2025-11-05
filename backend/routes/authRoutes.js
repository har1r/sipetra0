const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require("../controllers/authControllers");
const { protect } = require("../middlewares/authMiddlewares");

const router = express.Router();

/* ======================================================
   🧩 Auth Routes
   Semua endpoint user dan autentikasi
====================================================== */

// 🔹 Register user baru (hanya admin yang bisa menambah user baru)
router.post("/register", registerUser);

// 🔹 Login user
router.post("/login", loginUser);

// 🔹 Get profil user login (butuh JWT token)
router.get("/profile", protect, getUserProfile);

module.exports = router;

// const express = require("express");
// const { registerUser, loginUser, getUserProfile } = require("../controllers/authControllers");
// const upload = require("../middlewares/uploadMiddlewares");
// const { protect } = require("../middlewares/authMiddlewares");

// const router = express.Router();

// router.post("/register", registerUser);
// router.post("/login", loginUser);
// router.get("/profile", protect, getUserProfile);

// router.post("/upload-image", upload.single("image"), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//     const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
//     res.status(200).json({ imageUrl });
//   } catch (error) {
//     console.error("Upload error:", error);
//     res.status(500).json({ message: "Server error during upload" });
//   }
// });

// module.exports = router;
