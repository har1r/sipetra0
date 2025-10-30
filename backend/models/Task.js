const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema({
  stage: {
    type: String,
    enum: ["diinput", "ditata", "diteliti", "diarsipkan", "dikirim", "selesai"],
    required: true,
  },
  approverRole: {
    type: String,
    enum: ["admin", "penginput", "penata", "peneliti", "pengarsip", "pengirim"],
    required: true,
  },
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: {
    type: Date,
  },
  note: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  mainData: {
    nopel: { type: String, required: true },
    nop: { type: String, required: true },
    oldName: { type: String, required: true },
    address: { type: String, required: true },
    village: { type: String, required: true },
    subdistrict: { type: String, required: true },
  },

  additionalData: [
    {
      newName: { type: String, required: true },
      landWide: { type: Number, required: true },
      buildingWide: { type: Number, required: true },
      certificate: { type: String, required: true },
    },
  ],

  currentStage: {
    type: String,
    enum: ["diinput", "ditata", "diteliti", "diarsipkan", "dikirim", "selesai"],
    default: "diinput",
  },

  isCompleted: {
    type: Boolean,
    default: false,
  },

  approvals: [approvalSchema],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  // ===== Tambahan untuk surat pengantar (berbasis batch) =====
  noSuratPengantar: { type: Number, default: null }, // nomor urut (seq)
  batchId: { type: String, default: null }, // ID batch otomatis, ex: BATCH_2025_10_001
  exportCode: { type: String, default: null }, // 973/{seq}-UPT.PD.WIL.IV/{batchId}
});

taskSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Task", taskSchema);
