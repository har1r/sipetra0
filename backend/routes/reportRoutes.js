const express = require("express");
const { protect } = require("../middlewares/authMiddlewares");
const {
  getVerifiedTasks,
  getReports,
  createReports,
  generateReports,
  generatePartialMutations,
  addAttachmentToTasks
} = require("../modules/report/report.controller");
const {
  // createReport,
  // generateReport,
  // generatePartialMutation,
  // getVerifiedTasks,
  // addAttachmentToTask,
  // getReports,
  addAttachmentToReport,
  voidReport,
} = require("../controllers/reportControllers");

const router = express.Router();

// Tambahkan route sesuai kontroller
router.post("/create-report", protect, createReports);
router.post("/generate-report/:reportId", protect, generateReports);
router.post(
  "/generate-partial-mutation/:taskId",
  protect,
  generatePartialMutations,
);
router.get("/get-verified-tasks", protect, getVerifiedTasks);
router.post("/add-attachment-to-task/:taskId", protect, addAttachmentToTasks);
router.get("/exported-reports", protect, getReports);
router.put("/attachment/:reportId", protect, addAttachmentToReport);
router.patch("/void-report/:reportId", protect, voidReport);

module.exports = router;
