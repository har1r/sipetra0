const mongoose = require("mongoose");

const recommendationLetterSchema = new mongoose.Schema(
  {
    batchId: { type: String, unique: true },
    sequence: { type: Number, default: 0 },
    year: { type: Number, required: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  },
  {
    timestamps: true,
  }
);

// Middleware: generate batchId otomatis sebelum save
recommendationLetterSchema.pre("save", async function (next) {
  // hanya jalankan jika batchId belum ada
  if (!this.batchId) {
    const now = new Date();
    const year = now.getFullYear();

    // Hitung total batch untuk tahun berjalan
    const count = await mongoose
      .model("ExportCounter")
      .countDocuments({ year });

    // Tentukan urutan (sequence)
    this.sequence = count + 1;
    this.year = year;

    // Format batchId → contoh: 973/1-UPT.PD.WIL.IV/2025
    this.batchId = `973/${this.sequence}-UPT.PD.WIL.IV/${year}`;
  }

  next();
});

recommendationLetterSchema.index({ sequence: 1, year: 1 });
recommendationLetterSchema.index({ createdAt: 1 });

module.exports = mongoose.model(
  "RecommendationLetter",
  recommendationLetterSchema
);

// const mongoose = require("mongoose");

// const recommendationLetterSchema = new mongoose.Schema({
//   batchId: { type: String, unique: true },
//   seq: { type: Number, default: 0 },
//   year: { type: Number },
//   month: { type: String },
//   createdAt: { type: Date, default: Date.now },
// });

// // 🧠 Middleware: generate batchId otomatis sebelum save
// recommendationLetterSchema.pre("save", async function (next) {
//   if (!this.batchId) {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, "0");

//     // Hitung urutan batch untuk bulan ini
//     const count = await mongoose.model("ExportCounter").countDocuments({
//       batchId: new RegExp(`^BATCH_${year}_${month}`),
//     });

//     // Format batchId → contoh: BATCH_2025_10_001
//     this.batchId = `BATCH_${year}_${month}_${String(count + 1).padStart(
//       3,
//       "0"
//     )}`;
//     this.year = year;
//     this.month = month;
//   }

//   next();
// });

// module.exports = mongoose.model("ExportCounter", recommendationLetterSchema);
