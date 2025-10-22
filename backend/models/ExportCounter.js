const mongoose = require("mongoose");

const exportCounterSchema = new mongoose.Schema({
  batchId: { type: String, unique: true },
  seq: { type: Number, default: 0 },
  year: { type: Number },
  month: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// 🧠 Middleware: generate batchId otomatis sebelum save
exportCounterSchema.pre("save", async function (next) {
  if (!this.batchId) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    // Hitung urutan batch untuk bulan ini
    const count = await mongoose.model("ExportCounter").countDocuments({
      batchId: new RegExp(`^BATCH_${year}_${month}`),
    });

    // Format batchId → contoh: BATCH_2025_10_001
    this.batchId = `BATCH_${year}_${month}_${String(count + 1).padStart(
      3,
      "0"
    )}`;
    this.year = year;
    this.month = month;
  }

  next();
});

module.exports = mongoose.model("ExportCounter", exportCounterSchema);

// const mongoose = require("mongoose");

// const titleSeqSchema = new mongoose.Schema({
//   title: { type: String, required: true }, // judul task
//   seq: { type: Number, required: true },   // nomor export
// });

// const exportCounterSchema = new mongoose.Schema({
//   year: { type: Number, required: true, unique: true },
//   seq: { type: Number, default: 0 },       // seq global untuk title baru
//   titles: [titleSeqSchema],
// });

// module.exports = mongoose.model("ExportCounter", exportCounterSchema);
