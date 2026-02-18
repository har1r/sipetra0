const mongoose = require("mongoose");

/**
 * 1. Sub-Schema: Lampiran File
 */
const fileAttachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  driveLink: { type: String, trim: true, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
});

/**
 * 2. Sub-Schema: Data Pecahan/Tambahan
 */
const additionalDataSchema = new mongoose.Schema({
  newName: { type: String, required: true, trim: true },
  landWide: { type: Number, required: true, min: 0 },
  buildingWide: { type: Number, required: true, min: 0 },
  certificate: { type: String, required: true, trim: true },
  addStatus: {
    type: String,
    enum: ["in_progress", "approved"],
    default: "in_progress",
  },
  note: { type: String, trim: true, default: "" },
});

/**
 * 3. Sub-Schema: Jejak Persetujuan (Approvals)
 */
const approvalSchema = new mongoose.Schema(
  {
    stageOrder: { type: Number, required: true },
    stage: {
      type: String,
      required: true,
      // Konsisten dengan urutan proses
      enum: [
        "diinput",
        "ditata",
        "diteliti",
        "diarsipkan",
        "dikirim",
        "diperiksa",
        "selesai",
      ],
      default: "diinput",
    },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date, default: null },
    note: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["in_progress", "approved", "rejected", "revised"],
      default: "in_progress",
    },
  },
  { _id: false },
);

/**
 * 4. Main Schema: Task
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      enum: [
        "Pengaktifan",
        "Mutasi Habis Update",
        "Mutasi Habis Reguler",
        "Mutasi Sebagian",
        "Pembetulan",
        "Objek Pajak Baru",
      ],
      required: true,
    },
    mainData: {
      nopel: { type: String, required: true, trim: true },
      nop: { type: String, required: true, trim: true },
      oldName: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      village: { type: String, required: true, trim: true },
      subdistrict: { type: String, required: true, trim: true },
      oldlandWide: { type: Number, required: true, min: 0 },
      oldbuildingWide: { type: Number, required: true, min: 0 },
    },
    additionalData: [additionalDataSchema],
    attachments: [fileAttachmentSchema],
    currentStage: {
      type: String,
      enum: [
        "diinput",
        "ditata",
        "diteliti",
        "diarsipkan",
        "dikirim",
        "diperiksa",
        "selesai",
      ],
      default: "diinput",
    },
    overallStatus: {
      type: String,
      enum: ["in_progress", "approved", "rejected", "revised"],
      default: "in_progress",
    },
    approvals: [approvalSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // --- TAMBAHKAN DI SINI ---
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null,
    },
    globalNote: { type: String, trim: true, default: "" },
    revisedHistory: {
      revisedAct: String,
      revisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      revisedNote: String,
      revisedAt: Date,
      isResolved: { type: Boolean, default: false },
      resolvedAt: Date,
    },
  },
  {
    timestamps: true,
    // Mengaktifkan toJSON transform agar data lebih bersih saat dikirim ke frontend
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// --- INDEXING UNTUK SEARCH PERFORMANCE ---
// Mempercepat pencarian berdasarkan nama lama atau desa
// 1. Index Unik (Sudah ada di field, tapi pastikan ditegaskan di sini)
// Mempercepat pencarian NOPEL dan menjamin tidak ada duplikasi
taskSchema.index({ "mainData.nopel": 1 }, { unique: true });

// 2. Index untuk Pencarian Spesifik (Equality)
// Digunakan untuk filter dropdown atau pencarian ID yang pasti
taskSchema.index({ "mainData.nop": 1 });
taskSchema.index({ overallStatus: 1 });
taskSchema.index({ currentStage: 1 });

// 3. Compound Index untuk Sort & Filter (Sangat Penting untuk getAllTasks)
// Karena getAllTasks sering melakukan filter status/stage sambil mengurutkan berdasarkan tanggal terbaru
taskSchema.index({ overallStatus: 1, createdAt: -1 });
taskSchema.index({ currentStage: 1, createdAt: -1 });

// 4. Text Index untuk Pencarian Kata (Fuzzy Search)
// Memungkinkan pencarian potongan kata pada Judul, Nama Lama, atau Nopel secara bersamaan
taskSchema.index(
  {
    title: "text",
    "additionalData.newName": "text",
    "mainData.nopel": "text",
  },
  {
    weights: { title: 10, "additionalData.newName": 7, "mainData.nopel": 2 },
    name: "TaskTextSearchIndex",
  },
);

// 5. Index untuk Filter Tanggal
taskSchema.index({ createdAt: -1 });

// --- MIDDLEWARE: Otomasi Status ---
taskSchema.pre("save", function (next) {
  // Jika tidak ada perubahan pada approvals atau stage, lewati logika berat ini
  if (!this.isModified("approvals") && !this.isModified("currentStage")) {
    return next();
  }

  const approvals = this.approvals;

  // 1. Prioritas Tertinggi: REJECTED
  if (approvals.some((app) => app.status === "rejected")) {
    this.overallStatus = "rejected";
  }
  // 2. Prioritas Kedua: REVISED (Jika ada stage yang berstatus revised)
  else if (approvals.some((app) => app.status === "revised")) {
    this.overallStatus = "revised";
  }
  // 3. Cek apakah sudah SELESAI
  else if (this.currentStage === "selesai") {
    // Pastikan semua stage (terutama stage terakhir) sudah approved
    const allApproved = approvals.every((app) => app.status === "approved");
    this.overallStatus = allApproved ? "approved" : "in_progress";
  }
  // 4. Default: Dalam proses
  else {
    this.overallStatus = "in_progress";
  }

  next();
});

module.exports = mongoose.model("Task", taskSchema);
