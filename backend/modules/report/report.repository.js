const Task = require("../../models/Task");
const Report = require("../../models/Report");

exports.findTasksByIds = async (ids, session) => {
  const uniqueIds = [...new Set(ids)];
  return await Task.find({ _id: { $in: uniqueIds } })
    .populate("reportId")
    .session(session);
};

exports.createReport = async (taskIds, userId, session) => {
  const report = new Report({
    tasks: taskIds,
    generatedBy: userId,
    status: "FINAL",
  });

  return await report.save({ session });
};

exports.attachTasksToReport = async (taskIds, reportId, session) => {
  return await Task.updateMany(
    { _id: { $in: taskIds } },
    { $set: { reportId } },
    { session },
  );
};

exports.findReportWithTasks = async (reportId) => {
  return Report.findById(reportId).populate("tasks").lean();
};
