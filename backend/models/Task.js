const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema(
  {
    stageOrder: {
      type: Number,
      required: true,
    },
    stage: {
      type: String,
      enum: [
        "diinput",
        "ditata",
        "diteliti",
        "diarsipkan",
        "dikirim",
        "selesai",
      ],
      required: true,
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    note: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["in_progress", "approved", "rejected"],
      default: "in_progress",
    },
  },
  {
    timestamps: true,
  }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    mainData: {
      nopel: { type: String, required: true, trim: true, unique: true },
      nop: { type: String, required: true, trim: true },
      oldName: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      village: { type: String, required: true, trim: true },
      subdistrict: { type: String, required: true, trim: true },
    },
    additionalData: [
      {
        newName: { type: String, required: true, trim: true },
        landWide: { type: Number, required: true },
        buildingWide: { type: Number, required: true },
        certificate: { type: String, required: true, trim: true },
        addStatus: {
          type: String,
          enum: ["in_progress", "approved", "rejected"],
          default: "in_progress",
        },
      },
    ],
    currentStage: {
      type: String,
      enum: [
        "diinput",
        "ditata",
        "diteliti",
        "diarsipkan",
        "dikirim",
        "selesai",
      ],
      default: "diinput",
    },
    overallStatus: {
      type: String,
      enum: ["in_progress", "approved", "rejected"],
      default: "in_progress",
    },
    approvals: [approvalSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    globalNote: {
      type: String,
      trim: true,
    },
    rejectedHistory: {
      rejectedAct: { type: String, default: null },
      rejectedName: { type: String, default: null },
      rejectedNote: { type: String, default: null },
      rejectedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Middleware: Auto-ubah overallStatus saat semua approval selesai
taskSchema.pre("findOneAndUpdate", async function (next) {
  console.log("🚀 Middleware: Cek dan update overallStatus tugas");
  const docToUpdate = await this.model.findOne(this.getQuery());
  console.log("🔍 Ditemukan tugas:", docToUpdate);
  if (!docToUpdate) return next();

  const allApproved = docToUpdate.approvals.every(
    (approval) => approval.status === "approved"
  );
  const anyRejected = docToUpdate.approvals.some(
    (approval) => approval.status === "rejected"
  );

  const update = this.getUpdate();
  if (anyRejected) update.overallStatus = "rejected";
  else if (allApproved) update.overallStatus = "approved";
  else update.overallStatus = "in_progress";

  this.setUpdate(update);
  next();
});

/* ==========================
   ⚡ Indexing untuk performa
========================== */
taskSchema.index({ "mainData.nopel": 1 });
taskSchema.index({ "additionalData.newName": 1 });
taskSchema.index({ title: 1 });
taskSchema.index({ overallStatus: 1 }); // Dari yang terlama ke terbaru
taskSchema.index({ createdAt: 1 });

module.exports = mongoose.model("Task", taskSchema);
