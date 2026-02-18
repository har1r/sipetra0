const Report = require("../models/Report");
const Task = require("../models/Task");

/**
 * Memproses pembuatan laporan (batching) untuk sekumpulan task.
 * @param {Array} taskIds - Daftar ID task yang akan dimasukkan ke laporan
 * @param {String} userId - ID admin yang melakukan proses ini
 */
const createBatchReport = async (taskIds, userId) => {
  try {
    // 1. Buat dokumen Report baru
    // Middleware pre-validate di Report.js akan otomatis mengurus:
    // - RecommendationCounter (Sequence +1)
    // - Generasi batchId (973/X-UPT.PD.WIL.IV/2026)
    const newReport = new Report({
      tasks: taskIds,
      generatedBy: userId,
      year: new Date().getFullYear(),
      status: "FINAL"
    });

    // Simpan report (ini akan men-trigger penomoran otomatis)
    await newReport.save();

    // 2. Update semua Task sekaligus (Mass Update)
    // Jauh lebih efisien daripada loop task.save()
    await Task.updateMany(
      { _id: { $in: taskIds } },
      { 
        $set: { 
          batchId: newReport._id,           // Referensi ke model Report
          exportCode: newReport.batchId,    // Nomor surat resmi (973/...)
          status: "SELESAI",               // Otomatis tandai selesai jika perlu
          isLocked: true                   // Kunci berkas agar tidak bisa diedit lagi
        } 
      }
    );

    return {
      success: true,
      message: "Laporan berhasil diterbitkan.",
      data: {
        batchId: newReport.batchId,
        sequence: newReport.sequence,
        totalTasks: newReport.totalTasks,
        reportId: newReport._id
      }
    };

  } catch (error) {
    console.error("Error creating batch report:", error);
    throw error;
  }
};

module.exports = { createBatchReport };