const Report = require("../models/Report");
const Task = require("../models/Task");

const createBatchReport = async (selectedTaskIds, userId) => {
  try {
    const tasks = await Task.find({ _id: { $in: selectedTaskIds } }).select("reportId").populate("reportId");

    const reportedTasks = tasks.find((task) => task.reportId !== null);

    if (reportedTasks) {
      const existingReport = await Report.findById(reportedTasks.reportId);

      if (existingReport) {
        return {
          success: true,
          message: "Berhasil! permohonan dicetak menggunakan nomor yang sudah ada.",
          data: {
            batchId: existingReport.batchId,
            sequence: existingReport.sequence,

          },
        };
      }
    }

    const newReport = new Report({
      tasks: selectedTaskIds,
      generatedBy: userId,
      status: "FINAL",
    });

    await newReport.save();

    // 3. Update Task hanya untuk yang baru saja diproses
    await Task.updateMany(
      { _id: { $in: selectedTaskIds } },
      {
        $set: {
          reportId: newReport._id,
          currentStage: "selesai",
          overallStatus: "approved",
        },
      },
    );

    return {
      success: true,
      message: "Laporan baru berhasil diterbitkan.",
      data: {
        batchId: newReport.batchId,
        sequence: newReport.sequence,
        totalTasks: newReport.totalTasks,
        reportId: newReport._id,
        isExisting: false,
      },
    };
  } catch (error) {
    console.error("Error creating batch report:", error);
    throw error;
  }
};

module.exports = { createBatchReport };
