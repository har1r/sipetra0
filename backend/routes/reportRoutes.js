const express = require("express");
const { protect } = require("../middlewares/authMiddlewares");
const {
  exportReport,
  getDaftarSuratPengantar,
  addAttachmentToTask,
  getExportedReports,
  addAttachmentToReport
} = require("../controllers/reportControllers");

const router = express.Router();

// Tambahkan route sesuai kontroller
router.post("/export-selected", protect, exportReport);
router.get("/daftar-surat-pengantar", protect, getDaftarSuratPengantar);
router.post("/add-attachment/:taskId", protect, addAttachmentToTask);
router.get("/exported-reports", protect, getExportedReports);
router.put("/attachment/:reportId", protect, addAttachmentToReport);

module.exports = router;
