const Task = require("../../models/Task");
const Report = require("../../models/Report");

// Fungsi untuk getVerifiedTasks
const findVerifiedTasks = async ({ filters, sortDirection, skip, limit }) => {
  const [totalData, tasks] = await Promise.all([
    Task.countDocuments(filters),
    Task.find(filters)
      .sort({ updatedAt: sortDirection })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "reportId",
        select: "batchId",
      })
      .select("title mainData additionalData attachment updatedAt reportId")
      .lean(),
  ]);

  return { totalData, tasks };
};
// Fungsi untuk getVerifiedTasks

// Fungsi untuk getReports
const findAllReports = async ({ filters, sortDirection, skip, limit }) => {
  const [totalData, reports] = await Promise.all([
    Report.countDocuments(filters),
    Report.find(filters)
      .sort({ createdAt: sortDirection })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "tasks",
        select: "additionalData",
      })
      .populate({
        path: "generatedBy",
        select: "name",
      })
      .select("batchId status updatedAt attachment")
      .lean(),
  ]);

  return { totalData, reports };
};
// Fungsi untuk getReports

// Fungsi untuk createReports
const findTasksWithReports = async (taskIds) => {
  return await Task.find({ _id: { $in: taskIds } })
    .populate({
      path: "reportId",
      select: "batchId",
    })
    .select("title")
    .lean();
};

const getLastSequenceInYear = async (year) => {
  return await Report.findOne({ year }).sort({ sequence: -1 }).lean();
};

const createReportDocument = async (reportData) => {
  return await Report.create(reportData);
};

const updateTasksReportReference = async (taskIds, reportId) => {
  return await Task.updateMany(
    { _id: { $in: taskIds } },
    { $set: { reportId } },
  );
};
// Fungsi untuk createReports

// Fungsi untuk generateReport
const getReportForPdf = async (reportId) => {
  return await Report.findById(reportId)
    .populate({
      path: "tasks"
    })
    .lean();
};
// Fungsi untuk generateReport

// Fungsi untuk generatePartialMutations
const findTaskById = async (taskId) => {
  return await Task.findById(taskId)
    .select("title mainData additionalData")
    .lean();
};
// Fungsi untuk generatePartialMutations

// Funsi untuk addAttachmentToTasks
const setAttachmentTask = async (taskId, attachmentData) => {
  return await Task.findByIdAndUpdate(
    taskId,
    { 
      $set: { attachment: attachmentData } 
    },
    { 
      new: true, 
      runValidators: true, 
      select: "attachment" 
    }
  ).lean();
};
// Funsi untuk addAttachmentToTasks

// Fungsi unutk addAttachmentToReport
const setAttachmentReport = async (reportId, attachmentData) => {
  return await Report.findByIdAndUpdate(
    reportId,
    {
      $set: {attachment: attachmentData}
    },
    {
      new: true, 
      runValidators: true, 
      select: "attachment" 
    }
  ).lean();
};
// Fungsi unutk addAttachmentToReport

const findReportById = async (reportId) => {
  return await Report.findById(reportId);
};

const updateReportStatus = async (reportId, status) => {
  return await Report.findByIdAndUpdate(
    reportId,
    { status: status },
    { new: true }
  );
};

const detachTasksFromReport = async (reportId) => {
  return await Task.updateMany(
    { reportId: reportId },
    { $set: { reportId: null } }
  );
};

module.exports = {
  findVerifiedTasks,
  findAllReports,
  findTasksWithReports,
  getLastSequenceInYear,
  createReportDocument,
  updateTasksReportReference,
  getReportForPdf,
  findTaskById,
  setAttachmentTask,
  setAttachmentReport,
  findReportById,
  updateReportStatus,
  detachTasksFromReport
};
