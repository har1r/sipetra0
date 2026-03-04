const Task = require("../../models/Task");

const buildTaskQuery = (filters) => {
  const query = {};
  const { search, title, currentStage, status, startDate, endDate } = filters;

  if (search) {
    const searchRegex = { $regex: String(search).trim(), $options: "i" };
    query.$or = [
      { "mainData.nopel": searchRegex },
      { "mainData.nop": searchRegex },
      { "mainData.subdistrict": searchRegex },
      { "mainData.village": searchRegex },
      { "additionalData.newName": searchRegex },
    ];
  }
  if (currentStage) query.currentStage = currentStage;
  if (title) query.title = title;

  if (status) {
    const s = status.toLowerCase();
    const statusMap = {
      ditolak: "rejected",
      revisi: "revised",
      selesai: "approved",
      proses: "in_progress",
    };
    if (statusMap[s]) {
      query.overallStatus = statusMap[s];
      if (s === "selesai") query.currentStage = "selesai";
    }
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt.$lte = end;
    }
  }
  return query;
};

const findTasksWithPagination = async (filters, page = 1, limit = 10) => {
  const query = buildTaskQuery(filters);
  const skip = (page - 1) * limit;

  const [tasks, totalCount] = await Promise.all([
    Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name username")
      .lean({ virtuals: true }),
    Task.countDocuments(query),
  ]);

  return { tasks, totalCount };
};

module.exports = { findTasksWithPagination, buildTaskQuery };
