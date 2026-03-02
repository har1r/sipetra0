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

module.exports = {
  findStatsTitleCard,
  findDelayedTasks,
};
