const express = require("express");
const { protect } = require("../middlewares/authMiddlewares");
const { getAllUsers } = require("../controllers/userControllers");

const router = express.Router();

// Tambahkan route sesuai kontroller
router.get("/", protect, getAllUsers)

module.exports = router;
