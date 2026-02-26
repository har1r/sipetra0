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
      .select("title mainData additionalData updatedAt reportId")
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
      .select("batchId status updatedAt")
      .lean(),
  ]);

  return { totalData, reports };
};
// Fungsi untuk getReports

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

module.exports = {
  findVerifiedTasks,
  findAllReports,
  findTasksWithReports,
  getLastSequenceInYear,
  createReportDocument,
  updateTasksReportReference,
};
