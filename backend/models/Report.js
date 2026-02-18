const mongoose = require("mongoose");

const reportCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  count: { type: Number, default: 0 },
});

const ReportCounter = mongoose.models.ReportCounter || mongoose.model("ReportCounter", reportCounterSchema);

const reportSchema = new mongoose.Schema(
  {
    batchId: { type: String, unique: true },
    sequence: { type: Number },
    year: { type: Number, required: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
    totalTasks: { type: Number, default: 0 },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    
    // FOKUS: Link Google Drive saja
    driveLink: { 
      type: String, 
      trim: true,
      default: null 
    },
    
    status: {
      type: String,
      enum: ["DRAFT", "FINAL", "VOID"],
      default: "FINAL"
    }
  },
  { timestamps: true }
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
        { upsert: true, new: true }
      );

      this.sequence = counter.count;
      this.year = currentYear;
      this.batchId = `973/${this.sequence}-UPT.PD.WIL.IV/${currentYear}`;
      
      if (this.tasks) {
        this.totalTasks = this.tasks.length;
      }
      
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

module.exports = mongoose.model("Report", reportSchema);