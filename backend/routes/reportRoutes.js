const express = require("express");
const { protect } = require("../middlewares/authMiddlewares");
const {
  exportSuratPengantarPDF,
  getDaftarSuratPengantar,
} = require("../controllers/reportControllers");

const router = express.Router();

// Tambahkan route sesuai kontroller
router.post("/export-selected", protect, exportSuratPengantarPDF);
router.get("/daftar-surat-pengantar", protect, getDaftarSuratPengantar);

module.exports = router;
