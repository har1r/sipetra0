const express = require("express");
const { protect } = require("../middlewares/authMiddlewares");
// const createReport =
//   require("../modules/report/report.controller").createReport;
// const generateReport =
//   require("../modules/report/report.controller").generateReport;
// const generatePartialMutation =
//   require("../modules/report/report.controller").generatePartialMutation;
// const getVerifiedTasks =
//   require("../modules/report/report.controller").getVerifiedTasks;
// const addAttachmentToTask =
//   require("../modules/report/report.controller").addAttachmentToTask;
// const getReports = require("../modules/report/report.controller").getReports;
// const addAttachmentToReport =
//   require("../modules/report/report.controller").addAttachmentToReport;
// const voidReport = require("../modules/report/report.controller").voidReport;

const {
  createReport,
  generateReport,
  generatePartialMutation,
  getVerifiedTasks,
  addAttachmentToTask,
  getReports,
  addAttachmentToReport,
  voidReport,
} = require("../controllers/reportControllers");

const router = express.Router();

// Tambahkan route sesuai kontroller
router.post("/create-report", protect, createReport);
router.post("/generate-report/:reportId", protect, generateReport);
router.post(
  "/generate-partial-mutation/:taskId",
  protect,
  generatePartialMutation,
);
router.get("/get-verified-tasks", protect, getVerifiedTasks);
router.post("/add-attachment-to-task/:taskId", protect, addAttachmentToTask);
router.get("/exported-reports", protect, getReports);
router.put("/attachment/:reportId", protect, addAttachmentToReport);
router.patch("/void-report/:reportId", protect, voidReport);

module.exports = router;
