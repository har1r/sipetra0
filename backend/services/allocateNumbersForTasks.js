const ExportCounter = require("../models/exportCounter");

const allocateNumbersForTasks = async (tasks) => {
  // 🔹 Cari batch terbaru (yang terakhir dibuat)
  let batch = await ExportCounter.findOne().sort({ createdAt: -1 });

  // 🔹 Kalau belum ada batch, buat batch baru dengan middleware pre-save
  if (!batch) {
    batch = new ExportCounter();
    await batch.save();
  }

  // 🔹 Naikkan seq sekali saja (untuk semua task di batch ini)
  const newSeq = batch.seq + 1;

  // 🔹 Buat kode ekspor berdasarkan seq baru
  const exportCode = `973/${newSeq}-UPT.PD.WIL.IV`;

  // 🔹 Loop semua task dan berikan nomor serta batchId yang sama
  const updates = [];
  for (const task of tasks) {
    task.noSuratPengantar = newSeq;
    task.batchId = batch.batchId;
    task.exportCode = exportCode;
    await task.save();

    updates.push({
      taskId: task._id,
      seq: newSeq,
      exportCode,
      batchId: batch.batchId,
    });
  }

  // 🔹 Simpan seq terakhir ke batch
  batch.seq = newSeq;
  await batch.save();

  return {
    updates,
    batchId: batch.batchId,
    year: batch.year,
    month: batch.month,
    seqTerakhir: newSeq,
  };
};

module.exports = { allocateNumbersForTasks };

// const ExportCounter = require("../models/ExportCounter");

// const allocateNumbersForTasks = async (tasks, year) => {
//   let counter = await ExportCounter.findOne({ year });
//   if (!counter) {
//     counter = await ExportCounter.create({ year, seq: 0, titles: [] });
//   }

//   const updates = [];
//   const titleSeqMap = {};

//   counter.titles.forEach((item) => {
//     titleSeqMap[item.title] = item.seq;
//   });

//   for (const task of tasks) {
//     const title = task.title;

//     if (task.tahunSuratPengantar === year && task.noSuratPengantar) continue;

//     let seq;
//     if (titleSeqMap[title]) {
//       // Title sudah ada → pakai seq yang sama
//       seq = titleSeqMap[title];
//     } else {
//       // Title baru → naikkan seq global
//       counter.seq += 1;
//       seq = counter.seq;

//       // Simpan di titleSeqMap & counter.titles
//       titleSeqMap[title] = seq;
//       counter.titles.push({ title, seq });
//     }

//     // Format kode export
//     const exportCode = `973/${seq}-UPT.PD.WIL.IV/${year}`;

//     // Update task
//     task.noSuratPengantar = seq;
//     task.tahunSuratPengantar = year;
//     task.exportCode = exportCode;
//     await task.save();

//     updates.push({ taskId: task._id, title, seq, exportCode });
//   }

//   await counter.save();
//   return updates;
// };

// module.exports = { allocateNumbersForTasks };
