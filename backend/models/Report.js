const mongoose = require("mongoose");

// Mendefinisikan skema untuk menyimpan nomor laporan terakhir pada setiap tahun tertentu (blueprint)
const reportCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
});

// Membuat model untuk skema reportCounterSchema (kontraktor)
const ReportCounter =
  mongoose.models.ReportCounter ||
  mongoose.model("ReportCounter", reportCounterSchema);

// Mendefinisikan skema utama untuk keseluruhan laporan
const reportSchema = new mongoose.Schema(
  {
    batchId: { type: String, unique: true },
    sequence: { type: Number, required: true },
    year: { type: Number, required: true, unique: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    driveLink: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["DRAFT", "FINAL", "VOID"],
      default: "FINAL",
    },
  },
  { timestamps: true },
);

// Middleware untuk meng-generate batchId, year, dan sequence secara otomatis saat membuat laporan baru
reportSchema.pre("validate", async function (next) {
  if (this.isNew && !this.batchId) {
    try {
      const currentYear = new Date().getFullYear();
      const counter = await ReportCounter.findOneAndUpdate(
        { year: currentYear },
        { $inc: { count: 1 } },
        { upsert: true, new: true },
      );

      this.sequence = String(counter.count).padStart(3, '0');
      this.year = currentYear;
      this.batchId = `973/${this.sequence}-UPT.PD.WIL.IV/${currentYear}`;

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

reportSchema.index({ sequence: 1, year: 1 });
reportSchema.index({ createdAt: -1 });

// Membuat model untuk skema reportSchema (kontraktor)
const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
module.exports = Report;
