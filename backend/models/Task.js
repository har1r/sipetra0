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
    rejectedAt: {
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
// const approvalSchema = new mongoose.Schema({
//   stage: {
//     type: String,
//     enum: ["diinput", "ditata", "diteliti", "diarsipkan", "dikirim", "selesai"],
//     required: true,
//   },
//   approverRole: {
//     type: String,
//     enum: ["admin", "penginput", "penata", "peneliti", "pengarsip", "pengirim"],
//     required: true,
//   },
//   approverId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   },
//   approvedAt: {
//     type: Date,
//   },
//   note: {
//     type: String,
//   },
//   status: {
//     type: String,
//     enum: ["pending", "approved", "rejected"],
//     default: "pending",
//   },
// });

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
  },
  {
    timestamps: true,
  }
);

// Middleware: Auto-ubah overallStatus saat semua approval selesai
taskSchema.pre("save", function (next) {
  const allApproved = this.approvals.every(
    (approval) => approval.status === "approved"
  );
  const anyRejected = this.approvals.some(
    (approval) => approval.status === "rejected"
  );

  if (anyRejected) {
    this.overallStatus = "rejected";
  } else if (allApproved) {
    this.overallStatus = "approved";
  } else {
    this.overallStatus = "in_progress";
  }

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

// const taskSchema = new mongoose.Schema({
//   title: {
//     type: String,
//     required: true,
//   },

//   mainData: {
//     nopel: { type: String, required: true },
//     nop: { type: String, required: true },
//     oldName: { type: String, required: true },
//     address: { type: String, required: true },
//     village: { type: String, required: true },
//     subdistrict: { type: String, required: true },
//   },

//   additionalData: [
//     {
//       newName: { type: String, required: true },
//       landWide: { type: Number, required: true },
//       buildingWide: { type: Number, required: true },
//       certificate: { type: String, required: true },
//     },
//   ],

//   currentStage: {
//     type: String,
//     enum: ["diinput", "ditata", "diteliti", "diarsipkan", "dikirim", "selesai"],
//     default: "diinput",
//   },

//   isCompleted: {
//     type: Boolean,
//     default: false,
//   },

//   approvals: [approvalSchema],

//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },

//   updatedAt: {
//     type: Date,
//     default: Date.now,
//   },

//   // ===== Tambahan untuk surat pengantar (berbasis batch) =====
//   noSuratPengantar: { type: Number, default: null }, // nomor urut (seq)
//   batchId: { type: String, default: null }, // ID batch otomatis, ex: BATCH_2025_10_001
//   exportCode: { type: String, default: null }, // 973/{seq}-UPT.PD.WIL.IV/{batchId}
// });

// taskSchema.pre("save", function (next) {
//   this.updatedAt = new Date();
//   next();
// });

module.exports = mongoose.model("Task", taskSchema);
