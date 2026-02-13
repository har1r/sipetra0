const mongoose = require("mongoose");

// Sub-schema untuk menjaga kebersihan root model
const additionalDataSchema = new mongoose.Schema({
  newName: { type: String, required: true, trim: true },
  landWide: { type: Number, required: true, min: 0 },
  buildingWide: { type: Number, required: true, min: 0 },
  certificate: { type: String, required: true, trim: true },
  addStatus: {
    type: String,
    enum: ["in_progress", "approved", "rejected"],
    default: "in_progress",
  },
  note: { type: String, trim: true, default: "" },
});

const approvalSchema = new mongoose.Schema(
  {
    stageOrder: { type: Number, required: true },
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
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date, default: null },
    note: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["in_progress", "approved", "rejected"],
      default: "in_progress",
    },
  },
  { timestamps: true },
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    mainData: {
      nopel: { type: String, required: true, trim: true, unique: true },
      nop: { type: String, required: true, trim: true },
      oldName: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      village: { type: String, required: true, trim: true },
      subdistrict: { type: String, required: true, trim: true },
    },
    additionalData: [additionalDataSchema],
    currentStage: { type: String, default: "diinput" },
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
    globalNote: { type: String, trim: true, default: "" },
    rejectedHistory: {
      rejectedAct: String,
      rejectedName: String,
      rejectedNote: String,
      rejectedAt: Date,
    },
  },
  { timestamps: true },
);

// Middleware: Update status keseluruhan otomatis
taskSchema.pre("save", function (next) {
  if (this.isModified("approvals")) {
    const statuses = this.approvals.map((a) => a.status);
    if (statuses.includes("rejected")) this.overallStatus = "rejected";
    else if (statuses.every((s) => s === "approved"))
      this.overallStatus = "approved";
    else this.overallStatus = "in_progress";
  }
  next();
});

// Indexing untuk pencarian cepat
taskSchema.index({ "mainData.nopel": 1 });
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);

// const mongoose = require("mongoose");

// const approvalSchema = new mongoose.Schema(
//   {
//     stageOrder: {
//       type: Number,
//       required: true,
//     },
//     stage: {
//       type: String,
//       enum: [
//         "diinput",
//         "ditata",
//         "diteliti",
//         "diarsipkan",
//         "dikirim",
//         "selesai",
//       ],
//       required: true,
//     },
//     approverId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     approvedAt: {
//       type: Date,
//       default: null,
//     },
//     note: {
//       type: String,
//       trim: true,
//     },
//     status: {
//       type: String,
//       enum: ["in_progress", "approved", "rejected"],
//       default: "in_progress",
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// const taskSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     mainData: {
//       nopel: { type: String, required: true, trim: true, unique: true },
//       nop: { type: String, required: true, trim: true },
//       oldName: { type: String, required: true, trim: true },
//       address: { type: String, required: true, trim: true },
//       village: { type: String, required: true, trim: true },
//       subdistrict: { type: String, required: true, trim: true },
//     },
//     additionalData: [
//       {
//         newName: { type: String, required: true, trim: true },
//         landWide: { type: Number, required: true },
//         buildingWide: { type: Number, required: true },
//         certificate: { type: String, required: true, trim: true },
//         addStatus: {
//           type: String,
//           enum: ["in_progress", "approved", "rejected"],
//           default: "in_progress",
//         },
//         note: {
//           type: String,
//           trim: true,
//         },
//       },
//     ],
//     currentStage: {
//       type: String,
//       enum: [
//         "diinput",
//         "ditata",
//         "diteliti",
//         "diarsipkan",
//         "dikirim",
//         "selesai",
//       ],
//       default: "diinput",
//     },
//     overallStatus: {
//       type: String,
//       enum: ["in_progress", "approved", "rejected"],
//       default: "in_progress",
//     },
//     approvals: [approvalSchema],
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     globalNote: {
//       type: String,
//       trim: true,
//     },
//     rejectedHistory: {
//       rejectedAct: { type: String, default: null },
//       rejectedName: { type: String, default: null },
//       rejectedNote: { type: String, default: null },
//       rejectedAt: { type: Date, default: null },
//     },
//   },
//   {
//     timestamps: true,
//   },
// );

// // Middleware: Auto-ubah overallStatus saat semua approval selesai
// taskSchema.pre("findOneAndUpdate", async function (next) {
//   console.log("🚀 Middleware: Cek dan update overallStatus tugas");
//   const docToUpdate = await this.model.findOne(this.getQuery());
//   console.log("🔍 Ditemukan tugas:", docToUpdate);
//   if (!docToUpdate) return next();

//   const allApproved = docToUpdate.approvals.every(
//     (approval) => approval.status === "approved",
//   );
//   const anyRejected = docToUpdate.approvals.some(
//     (approval) => approval.status === "rejected",
//   );

//   const update = this.getUpdate();
//   if (anyRejected) update.overallStatus = "rejected";
//   else if (allApproved) update.overallStatus = "approved";
//   else update.overallStatus = "in_progress";

//   this.setUpdate(update);
//   next();
// });

// /* ==========================
//    ⚡ Indexing untuk performa
// ========================== */
// taskSchema.index({ "additionalData.newName": 1 });
// taskSchema.index({ title: 1 });
// taskSchema.index({ overallStatus: 1 }); // Dari yang terlama ke terbaru
// taskSchema.index({ createdAt: 1 });

// module.exports = mongoose.model("Task", taskSchema);
