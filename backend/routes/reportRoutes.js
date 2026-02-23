const express = require("express");
const { protect } = require("../middlewares/authMiddlewares");
const {
  createReport,
  generateReport,
  getVerifiedTasksForExport,
  addAttachmentToTask,
  getBatchReportsHistory,
  addAttachmentToReport,
} = require("../controllers/reportControllers");

const router = express.Router();

// Tambahkan route sesuai kontroller
router.post("/create-report", protect, createReport);
router.post("/export-selected/:reportId", protect, generateReport);
router.get("/daftar-surat-pengantar", protect, getVerifiedTasksForExport);
router.post("/add-attachment/:taskId", protect, addAttachmentToTask);
router.get("/exported-reports", protect, getBatchReportsHistory);
router.put("/attachment/:reportId", protect, addAttachmentToReport);

module.exports = router;
