const repository = require("./dashboard.repository");

const getTaskSummaryCards = async () => {
  const rawData = await repository.findStatsTitleCard();

  return rawData.map((item) => {
    const summary = {
      title: item.title,
      total: item.total,
      revisi: 0,
      rejected: 0,
      selesai: 0,
      diperiksa: 0,
    };

    item.details.forEach((detail) => {
      if (detail.status === "revised") summary.revisi += detail.count;
      if (detail.status === "rejected") summary.rejected += detail.count;
      if (detail.stage === "selesai") summary.selesai += detail.count;
      if (detail.stage === "diperiksa") summary.diperiksa += detail.count;
    });

    return summary;
  });
};

const getTasksPendingMoreThanTwoWeeks = async () => {
  //   const twoWeeksAgo = new Date();
  //   twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twoWeeksAgo = new Date(2026, 2, 2, 12, 0);

  const tasks = await repository.findDelayedTasks(twoWeeksAgo);

  return tasks.map((task) => ({
    id: task._id,
    nopel: task.mainData.nopel,
    nop: task.mainData.nop,
    name: task.additionalData[0].newName,
    title: task.title,
    currentStage: task.currentStage,
    overallStatus: task.overallStatus,
    createdAt: task.createdAt,
    daysPending: Math.floor(
      (new Date() - task.createdAt) / (1000 * 60 * 60 * 24),
    ),
  }));
};

module.exports = {
  getTaskSummaryCards,
  getTasksPendingMoreThanTwoWeeks,
};
