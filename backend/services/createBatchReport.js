// const Report = require("../models/Report");
// const Task = require("../models/Task");

// const createBatchReport = async (selectedTasks, userId) => {
//   try {
//     const reportIds = selectedTasks.map(
//       (selectedTask) => selectedTask.reportId,
//     );

//     if (reportIds) {
//       const existingReport = await Report.find({
//         _id: { $in: reportIds },
//       });

//       if (existingReport) {
//         return {
//           success: true,
//           isRePrint: true,
//           message:
//             "Permohonan berhasil dicetak ulang menggunakan nomor pengantar yang sudah ada.",
//           data: {
//             batchId: existingReport.batchId,
//             sequence: existingReport.sequence,
//           },
//         };
//       }
//     }

//     const newReport = new Report({
//       tasks: selectedTasks,
//       generatedBy: userId,
//       status: "FINAL",
//     });

//     await newReport.save();

//     // 3. Update Task hanya untuk yang baru saja diproses
//     await Task.updateMany(
//       { _id: { $in: selectedTasks } },
//       {
//         $set: {
//           reportId: newReport._id,
//           currentStage: "selesai",
//           overallStatus: "approved",
//         },
//       },
//     );

//     return {
//       success: true,
//       message: "Laporan baru berhasil diterbitkan.",
//       data: {
//         batchId: newReport.batchId,
//         sequence: newReport.sequence,
//         totalTasks: newReport.totalTasks,
//         reportId: newReport._id,
//         isExisting: false,
//       },
//     };
//   } catch (error) {
//     console.error("Error creating batch report:", error);
//     throw error;
//   }
// };

// module.exports = { createBatchReport };
