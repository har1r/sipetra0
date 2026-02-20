const mongoose = require("mongoose");

// Skema untuk menyimpan nomor laporan terakhir untuk setiap tahun tertentu
const reportCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
});

const ReportCounter =
  mongoose.models.ReportCounter ||
  mongoose.model("ReportCounter", reportCounterSchema);

// Skema utama untuk keseluruhan laporan
const reportSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, unique: true },
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

/**
 * MIDDLEWARE: Otomatisasi Penomoran (batchId)
 */
reportSchema.pre("validate", async function (next) {
  if (this.isNew && !this.batchId) {
    try {
      const currentYear = this.year || new Date().getFullYear();
      const counter = await ReportCounter.findOneAndUpdate(
        { year: currentYear },
        { $inc: { count: 1 } },
        { upsert: true, new: true },
      );

      this.sequence = counter.count;
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

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
module.exports = Report;
