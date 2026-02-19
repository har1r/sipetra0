const express = require("express");
const { protect } = require("../middlewares/authMiddlewares");
const {
  exportReport,
  getVerifiedTasksForExport,
  addAttachmentToTask,
  getBatchReportsHistory,
  addAttachmentToReport,
} = require("../controllers/reportControllers");

const router = express.Router();

// Tambahkan route sesuai kontroller
router.post("/export-selected", protect, exportReport);
router.get("/daftar-surat-pengantar", protect, getVerifiedTasksForExport);
router.post("/add-attachment/:taskId", protect, addAttachmentToTask);
router.get("/exported-reports", protect, getBatchReportsHistory);
router.put("/attachment/:reportId", protect, addAttachmentToReport);

module.exports = router;
