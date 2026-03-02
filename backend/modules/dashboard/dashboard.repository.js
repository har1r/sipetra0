const Task = require("../../models/Task");

const findStatsTitleCard = async () => {
  return await Task.aggregate([
    {
      $group: {
        _id: {
          title: "$title",
          status: "$overallStatus",
          stage: "$currentStage",
        },
        count: { $sum: 1 },
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
          title: "$title"
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        subdistrict: "$_id.subdistrict",
        title: "$_id.title",
        count: 1
      }
    },
    {
      $sort: { subdistrict: 1, title: 1 }
    }
  ]);
};

// repositories/taskRepository.js
const findVillageForChart = async () => {
  return await Task.aggregate([
    {
      $group: {
        _id: {
          village: "$mainData.village",
          title: "$title"
        },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        village: "$_id.village",
        title: "$_id.title",
        count: 1
      }
    },
    {
      $sort: { village: 1, title: 1 }
    }
  ]);
};
module.exports = {
  findStatsTitleCard,
  findDelayedTasks,
  findSubdistrictForChart,
  findVillageForChart,
};
