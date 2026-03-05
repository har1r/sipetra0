const Task = require("../../models/Task");
const Report = require("../../models/Report");

const findStatsTitleCard = async () => {
  return await Task.aggregate([
    {
      $group: {
        _id: {
          title: "$title",
          status: "$overallStatus",
          stage: "$currentStage",
        },
        count: { $sum: { $size: { $ifNull: ["$additionalData", []] } } },
      },
    },
    {
      $group: {
        _id: "$_id.title",
        stats: {
          $push: {
            status: "$_id.status",
            stage: "$_id.stage",
            count: "$count",
          },
        },
        total: { $sum: "$count" },
      },
    },
    {
      $project: {
        _id: 0,
        title: "$_id",
        total: 1,
        details: "$stats",
      },
    },
  ]);
};

const findDelayedTasks = async (thresholdDate) => {
  return await Task.find({
    createdAt: { $lte: thresholdDate },
    currentStage: { $nin: ["diperiksa", "selesai"] },
    overallStatus: { $ne: "rejected" },
  }).sort({ createdAt: 1 });
};

const findSubdistrictForChart = async () => {
  return await Task.aggregate([
    {
      $group: {
        _id: {
          subdistrict: "$mainData.subdistrict",
          title: "$title",
        },
        count: {
          $sum: { $size: { $ifNull: ["$additionalData", []] } },
        },
      },
    },
    {
      $project: {
        _id: 0,
        subdistrict: "$_id.subdistrict",
        title: "$_id.title",
        count: 1,
      },
    },
    {
      $sort: { subdistrict: 1, title: 1 },
    },
  ]);
};

const findVillageForChart = async () => {
  return await Task.aggregate([
    {
      $group: {
        _id: {
          village: "$mainData.village",
          title: "$title",
        },
        count: {
          $sum: { $size: { $ifNull: ["$additionalData", []] } },
        },
      },
    },
    {
      $project: {
        _id: 0,
        village: "$_id.village",
        title: "$_id.title",
        count: 1,
      },
    },
    {
      $sort: { village: 1, title: 1 },
    },
  ]);
};

const countTotalTaskReported = async () => {
  const result = await Report.aggregate([
    { $match: { status: { $ne: "VOID" } } },

    {
      $group: {
        _id: null,
        totalBatch: { $sum: 1 },
        totalTasks: {
          $sum: {
            $cond: {
              if: { $isArray: "$tasks" },
              then: { $size: "$tasks" },
              else: 0,
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalBatch: 1,
        totalTasks: 1,
      },
    },
  ]);

  return result[0] || { totalBatch: 0, totalTasks: 0 };
};
module.exports = {
  findStatsTitleCard,
  findDelayedTasks,
  findSubdistrictForChart,
  findVillageForChart,
  countTotalTaskReported,
};
