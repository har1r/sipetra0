const Report = require("../models/Report");
const Task = require("../models/Task");

const createBatchReport = async (taskIds, userId) => {
  try {
    // 1. Ambil data task yang ada untuk pengecekan reportId
    const tasks = await Task.find({ _id: { $in: taskIds } }).select("reportId");

    // Cari task yang sudah punya reportId sebelumnya
    const existingReportTask = tasks.find((t) => t.reportId !== null);

    // LOGIKA: Jika ada salah satu task yang sudah punya batch,
    // maka kita gunakan Report yang lama (tidak buat baru)
    if (existingReportTask) {
      const existingReport = await Report.findById(existingReportTask.reportId);

      if (existingReport) {
        return {
          success: true,
          message: "Menggunakan nomor batch yang sudah ada.",
          data: {
            batchId: existingReport.batchId,
            sequence: existingReport.sequence,
            totalTasks: existingReport.tasks.length,
            reportId: existingReport._id,
            isExisting: true, // Flag penanda ini batch lama
          },
        };
      }
    }

    // 2. Jika semua task benar-benar baru, buat Report baru
    const newReport = new Report({
      tasks: taskIds,
      generatedBy: userId,
      year: new Date().getFullYear(),
      status: "FINAL",
    });

    await newReport.save();

    // 3. Update Task hanya untuk yang baru saja diproses
    await Task.updateMany(
      { _id: { $in: taskIds } },
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
