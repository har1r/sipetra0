const mongoose = require("mongoose");
const Task = require("../models/Task");
const moment = require("moment");

// Mapping stage ke role
const stageToRoleMap = {
  diinput: "penginput",
  ditata: "penata",
  diteliti: "peneliti",
  diarsipkan: "pengarsip",
  dikirim: "pengirim",
  selesai: "pengecek",
};

// Urutan stage workflow
const stageOrder = [
  "diinput",
  "ditata",
  "diteliti",
  "diarsipkan",
  "dikirim",
  "selesai",
];

// --- Stage mapping (role -> stage dokumen)
const stageMap = {
  penginput: "diinput",
  penata: "ditata",
  peneliti: "diteliti",
  pengarsip: "diarsipkan",
  pengirim: "dikirim",
};

/**
 * 🧾 Controller: Membuat task baru
 * - Hanya admin atau penginput yang boleh membuat task
 * - Validasi data sesuai struktur taskSchema
 */
const createTask = async (req, res) => {
  try {
    const user = req.user;
    const { title, mainData, additionalData, globalNote } = req.body;

    /* ======================================================
       1️⃣ Validasi Hak Akses
    ====================================================== */
    if (user.role !== "admin" && user.role !== "penginput") {
      return res.status(403).json({
        message: "Anda tidak memiliki izin untuk membuat berkas ini.",
      });
    }

    /* ======================================================
       2️⃣ Validasi Field Utama
    ====================================================== */
    if (!title || !mainData || !additionalData) {
      return res.status(400).json({
        message:
          "Bagian jenis permohonan, data utama, dan data tambahan wajib diisi.",
      });
    }

    const requiredMainFields = [
      "nopel",
      "nop",
      "oldName",
      "address",
      "village",
      "subdistrict",
    ];

    for (const field of requiredMainFields) {
      if (!mainData[field]) {
        return res.status(400).json({
          message: `Bagian nopel, nop, nama lama, alamat, desa/kelurahan, kecamatan pada data utama wajib diisi.`,
        });
      }
    }

    /* ======================================================
       3️⃣ Validasi additionalData
    ====================================================== */
    if (!Array.isArray(additionalData) || additionalData.length === 0) {
      return res.status(400).json({
        message:
          "Bagian data tamabahan harus berupa array dan tidak boleh kosong.",
      });
    }

    for (const [index, item] of additionalData.entries()) {
      if (
        !item.newName ||
        typeof item.landWide !== "number" ||
        typeof item.buildingWide !== "number" ||
        !item.certificate
      ) {
        return res.status(400).json({
          message: `bagian nama baru, luas tanah, luas bangunan, sertifikat pada data tambahan wajib diisi untuk pecahan ke ${index}.`,
        });
      }
    }

    /* ======================================================
       4️⃣ Siapkan struktur approvals default
       sesuai stageToRoleMap (misal: diinput → penginput, ditata → penata, dst.)
    ====================================================== */
    const approvals = Object.entries(stageToRoleMap).map(
      ([stage, approverRole], index) => ({
        stageOrder: index + 1, // urutan tahap approval
        stage,
        approverRole,
        approverId: null, // belum ada yang approve
        approvedAt: null,
        rejectedAt: null,
        note: "",
        status: "in_progress",
      })
    );

    /* ======================================================
       5️⃣ Buat dan simpan task baru
    ====================================================== */
    const task = new Task({
      title,
      mainData,
      additionalData,
      currentStage,
      overallStatus: "in_progress",
      globalNote: globalNote || "",
      createdBy: user._id,
      approvals,
    });

    await task.save();

    /* ======================================================
       6️⃣ Kirim respons sukses
    ====================================================== */
    return res.status(201).json({
      message: "Berkas berhasil dibuat.",
      task,
    });
  } catch (error) {
    console.error("Error membuat berkas:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat membuat berkas.",
      error: error.message,
    });
  }
};

// @Deskripsi Membuat tugas baru
// @Route     POST /api/tasks/
// @Access    Private (hanya admin dan approver input yang bisa membuat task)
// const createTask = async (req, res) => {
//   try {
//     const user = req.user;
//     const { title, mainData, additionalData, currentStage } = req.body;

//     // Validasi role
//     if (
//       user.role !== "admin" &&
//       !(user.role === "penginput" && currentStage === "diinput")
//     ) {
//       return res
//         .status(403) //forbidden
//         .json({
//           message: "Anda tidak memiliki izin untuk membuat berkas ini.",
//         });
//     }

//     // Validasi input
//     if (!title || !mainData || !additionalData) {
//       return res.status(400).json({
//         message: "Field title, mainData, dan additionalData wajib diisi.", //request yang tidak valid.
//       });
//     }

//     const requiredMainFields = [
//       "nopel",
//       "nop",
//       "oldName",
//       "address",
//       "village",
//       "subdistrict",
//     ];

//     // Cek apakah setiap fieldnya diisi atau tidak
//     for (const field of requiredMainFields) {
//       if (!mainData[field]) {
//         return res
//           .status(400)
//           .json({ message: `Field mainData.${field} wajib diisi.` });
//       }
//     }

//     if (!Array.isArray(additionalData) || additionalData.length === 0) {
//       return res.status(400).json({
//         message:
//           "Field additionalData harus berupa array dan tidak boleh kosong.",
//       });
//     }

//     // Validasi setiap additionalData
//     for (const [index, item] of additionalData.entries()) {
//       //mengembalikan iterator berisi pasangan [index, value]
//       if (
//         !item.newName ||
//         typeof item.landWide !== "number" ||
//         typeof item.buildingWide !== "number" ||
//         !item.certificate
//       ) {
//         return res.status(400).json({
//           message: `Field newName, landWide, buildingWide, certificate wajib diisi pada additionalData index ${index}.`,
//         });
//       }
//     }

//     // Hasilkan approvals sesuai schema (stageToRoleMap sudah harus ada)
//     const approvals = Object.entries(stageToRoleMap).map(
//       //mengembalikan iterator berisi pasangan [stage, approverRole] (menghasilkan array of object)
//       ([stage, approverRole]) => ({
//         stage,
//         approverRole,
//         approverId: null,
//         approvedAt: null,
//         note: "",
//         status: "pending",
//       })
//     );

//     // Buat task
//     const task = new Task({
//       title,
//       mainData,
//       additionalData,
//       currentStage: currentStage || "diinput",
//       createdBy: user._id,
//       approvals,
//     });

//     await task.save();

//     return res.status(201).json({
//       //dibuat
//       message: "Berkas berhasil dibuat.",
//       task,
//     });
//   } catch (error) {
//     console.error("Error membuat berkas:", error);
//     return res.status(500).json({
//       //server error
//       message: "Terjadi kesalahan saat membuat berkas.",
//       error: error.message,
//     });
//   }
// };

// @Deskripsi Mengupdate approval
// @Route     PATCH /api/tasks/:id/approve
// @Access    Private (hanya admin dan approver pada stagenya yang bisa approve)
const approveTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { action, note } = req.body;
    const user = req.user;

    // 1) Validasi input
    if (!["approved", "rejected"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Action harus 'approved' atau 'rejected'." });
    }
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "taskId tidak valid." });
    }
    const safeNote =
      typeof note === "string" ? note.trim().slice(0, 1000) : undefined;

    // 2) Ambil minimal data (lean) untuk validasi role & status saat ini
    const task = await Task.findById(taskId)
      .select(
        "currentStage approvals isCompleted title mainData.nop mainData.nopel createdAt"
      )
      .lean();

    if (!task)
      return res.status(404).json({ message: "Task tidak ditemukan." });

    const currentStage = task.currentStage;
    const stageIdx = Array.isArray(stageOrder)
      ? stageOrder.indexOf(currentStage)
      : -1;
    if (stageIdx === -1) {
      return res
        .status(400)
        .json({ message: "Stage saat ini tidak valid pada workflow." });
    }

    const approval = (task.approvals || []).find(
      (value) => value?.stage === currentStage
    );
    if (!approval) {
      return res
        .status(400)
        .json({ message: "Approval stage tidak ditemukan." });
    }

    // 3) Role check: hanya admin atau approver role yg ditetapkan utk stage ini
    if (user?.role !== "admin" && user?.role !== approval.approverRole) {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki izin untuk approve stage ini." });
    }

    // 4) Hanya izinkan dua skenario:
    //    - first action (status 'pending')
    //    - overwrite dari 'rejected'
    if (!["pending", "rejected"].includes(approval.status || "pending")) {
      return res.status(400).json({
        message:
          "Overwrite hanya diizinkan dari status 'rejected' (atau aksi pertama dari 'pending').",
      });
    }

    // 5) Hitung next stage bila approved
    const lastIdx = stageOrder.length - 1;
    const nextStage =
      action === "approved"
        ? stageIdx < lastIdx
          ? stageOrder[stageIdx + 1]
          : "selesai"
        : currentStage;

    // 6) Siapkan operasi update atomik pada elemen approval yang MATCH stage aktif + status awal yang sama
    const setOps = {
      "approvals.$.status": action,
      "approvals.$.approvedAt": new Date(),
      "approvals.$.approverId": user._id,
    };
    if (safeNote) setOps["approvals.$.note"] = safeNote;

    if (action === "approved") {
      setOps.currentStage = nextStage;
      setOps.isCompleted = nextStage === "selesai";
      setOps.rejectedStage = null;
    } else {
      setOps.isCompleted = false;
      setOps.rejectedStage = currentStage;
    }

    const updateDoc = {
      $set: setOps,
      $push: {
        "approvals.$.history": {
          prevStatus: approval.status || "pending",
          newStatus: action,
          at: new Date(),
          by: user._id,
          note: safeNote ?? null,
          type:
            (approval.status || "pending") === "pending"
              ? "approve"
              : "overwrite",
        },
      },
    };

    // Penting: pakai $elemMatch agar positional `$` mengacu ke elemen yang sama (stage & status awal)
    const query = {
      _id: taskId,
      currentStage,
      approvals: {
        $elemMatch: {
          stage: currentStage,
          status: approval.status || "pending",
        },
      },
    };

    const updated = await Task.findOneAndUpdate(query, updateDoc, {
      new: true,
      runValidators: true,
      projection: {
        _id: 1,
        title: 1,
        currentStage: 1,
        isCompleted: 1,
        rejectedStage: 1,
        "mainData.nop": 1,
        "mainData.nopel": 1,
        approvals: 1,
        createdAt: 1,
      },
    });

    if (!updated) {
      // Bisa karena status sudah berubah oleh user lain (race) atau stage bergeser.
      return res.status(409).json({
        message:
          "Task berubah di server (stage/status tidak lagi sesuai). Muat ulang data lalu coba lagi.",
      });
    }

    res.set("Cache-Control", "no-store");
    return res.status(200).json({
      message: `Task ${action} di stage '${currentStage}'.`,
      task: updated,
    });
  } catch (error) {
    console.error("Error approving task:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat approve task.",
      error: error?.message || String(error),
    });
  }
};
// const approveTask = async (req, res) => {
//   try {
//     const { taskId } = req.params;
//     const { action, note } = req.body;
//     const user = req.user;

//     // 1) Validasi input
//     if (!["approved", "rejected"].includes(action)) {
//       return res
//         .status(400)
//         .json({ message: "Action harus 'approved' atau 'rejected'." });
//     }
//     if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
//       return res.status(400).json({ message: "taskId tidak valid." });
//     }
//     const safeNote =
//       typeof note === "string" ? note.trim().slice(0, 1000) : undefined;

//     // 2) Ambil data task
//     const task = await Task.findById(taskId)
//       .select(
//         "currentStage approvals isCompleted title mainData.nop mainData.nopel createdAt noSuratPengantar"
//       )
//       .lean();

//     if (!task)
//       return res.status(404).json({ message: "Task tidak ditemukan." });

//     const currentStage = task.currentStage;
//     const stageIdx = stageOrder.indexOf(currentStage);
//     if (stageIdx === -1) {
//       return res
//         .status(400)
//         .json({ message: "Stage saat ini tidak valid pada workflow." });
//     }

//     const approval = (task.approvals || []).find(
//       (value) => value.stage === currentStage
//     );
//     if (!approval) {
//       return res
//         .status(400)
//         .json({ message: "Approval stage tidak ditemukan." });
//     }

//     // 3) Role check
//     if (user.role !== "admin" && user.role !== approval.approverRole) {
//       return res
//         .status(403)
//         .json({ message: "Anda tidak memiliki izin untuk approve stage ini." });
//     }

//     // 4) Hanya izinkan aksi pertama atau overwrite dari rejected
//     if (!["pending", "rejected"].includes(approval.status || "pending")) {
//       return res.status(400).json({
//         message:
//           "Overwrite hanya diizinkan dari status 'rejected' (atau aksi pertama dari 'pending').",
//       });
//     }

//     // 5) Hitung next stage bila approved
//     const lastIdx = stageOrder.length - 1;
//     const nextStage =
//       action === "approved"
//         ? stageIdx < lastIdx
//           ? stageOrder[stageIdx + 1]
//           : "selesai"
//         : currentStage;

//     // 6) Siapkan operasi update atomik
//     const setOps = {
//       "approvals.$.status": action,
//       "approvals.$.approvedAt": new Date(),
//       "approvals.$.approverId": user._id,
//     };
//     if (safeNote) setOps["approvals.$.note"] = safeNote;

//     if (action === "approved") {
//       setOps.currentStage = nextStage;

//       // Logic khusus stage diteliti: jangan set isCompleted true kalau noSuratPengantar belum ada
//       if (
//         nextStage === "selesai" &&
//         currentStage === "diteliti" &&
//         !task.noSuratPengantar
//       ) {
//         setOps.isCompleted = false; // tetap false
//       } else {
//         setOps.isCompleted = nextStage === "selesai";
//       }

//       setOps.rejectedStage = null;
//     } else {
//       setOps.isCompleted = false;
//       setOps.rejectedStage = currentStage;
//     }

//     const updateDoc = {
//       $set: setOps,
//       $push: {
//         "approvals.$.history": {
//           prevStatus: approval.status || "pending",
//           newStatus: action,
//           at: new Date(),
//           by: user._id,
//           note: safeNote ?? null,
//           type:
//             (approval.status || "pending") === "pending"
//               ? "approve"
//               : "overwrite",
//         },
//       },
//     };

//     // 7) Query dengan $elemMatch
//     const query = {
//       _id: taskId,
//       currentStage,
//       approvals: {
//         $elemMatch: {
//           stage: currentStage,
//           status: approval.status || "pending",
//         },
//       },
//     };

//     const updated = await Task.findOneAndUpdate(query, updateDoc, {
//       new: true,
//       runValidators: true,
//       projection: {
//         _id: 1,
//         title: 1,
//         currentStage: 1,
//         isCompleted: 1,
//         rejectedStage: 1,
//         "mainData.nop": 1,
//         "mainData.nopel": 1,
//         approvals: 1,
//         createdAt: 1,
//         noSuratPengantar: 1,
//       },
//     });

//     if (!updated) {
//       return res.status(409).json({
//         message:
//           "Task berubah di server (stage/status tidak lagi sesuai). Muat ulang data lalu coba lagi.",
//       });
//     }

//     res.set("Cache-Control", "no-store");
//     return res.status(200).json({
//       message: `Task ${action} di stage '${currentStage}'.`,
//       task: updated,
//       note:
//         nextStage === "selesai" &&
//         currentStage === "diteliti" &&
//         !task.noSuratPengantar
//           ? "Task sudah lanjut tapi belum bisa dianggap selesai karena nomor surat pengantar belum ada."
//           : undefined,
//     });
//   } catch (error) {
//     console.error("Error approving task:", error);
//     return res.status(500).json({
//       message: "Terjadi kesalahan saat approve task.",
//       error: error?.message || String(error),
//     });
//   }
// };

// @Deskripsi  Memperbarui data task/berkas
// @Route      PATCH /api/tasks/:taskId
// @Access     Private (admin atau approver sesuai stage berjalan)
const updateTask = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.params;
    const { title, mainData, additionalData } = req.body;

    // --- Ambil task untuk cek currentStage & validasi role ---
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task tidak ditemukan." });
    }

    // --- Validasi role (selaras createTask) ---
    // Admin boleh update semua; non-admin harus sesuai role stage yang berjalan.
    const requiredRoleForStage = stageToRoleMap[task.currentStage]; // contoh: 'penginput' untuk 'diinput'
    const isAllowed =
      user.role === "admin" ||
      (requiredRoleForStage && user.role === requiredRoleForStage);

    if (!isAllowed) {
      return res.status(403).json({
        message: "Anda tidak memiliki izin untuk mengupdate task ini.",
      });
    }

    // --- Validasi input (selaras createTask) ---
    if (!title || !mainData || !additionalData) {
      return res.status(400).json({
        message: "Field title, mainData, dan additionalData wajib diisi.",
      });
    }

    const requiredMainFields = [
      "nopel",
      "nop",
      "oldName",
      "address",
      "village",
      "subdistrict",
    ];
    for (const field of requiredMainFields) {
      if (!mainData[field]) {
        return res
          .status(400)
          .json({ message: `Field mainData.${field} wajib diisi.` });
      }
    }

    if (!Array.isArray(additionalData) || additionalData.length === 0) {
      return res.status(400).json({
        message:
          "Field additionalData harus berupa array dan tidak boleh kosong.",
      });
    }

    // --- Validasi setiap item additionalData (selaras createTask) ---
    for (const [index, item] of additionalData.entries()) {
      const landIsNumber =
        typeof item.landWide === "number" && Number.isFinite(item.landWide);
      const buildingIsNumber =
        typeof item.buildingWide === "number" &&
        Number.isFinite(item.buildingWide);

      if (
        !item.newName ||
        !landIsNumber ||
        !buildingIsNumber ||
        !item.certificate
      ) {
        return res.status(400).json({
          message: `Field newName, landWide, buildingWide, certificate wajib diisi pada additionalData index ${index}.`,
        });
      }
    }

    // --- Update data utama ---
    task.title = title;
    task.mainData = mainData;
    task.additionalData = additionalData;

    await task.save();

    return res.status(200).json({
      message: "Berkas berhasil diperbarui.",
      task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengupdate task.",
      error: error.message,
    });
  }
};

// @Deskripsi Menghapus task
// @Route     DELETE /api/tasks/:id
// @Access    Private (hanya admin)
const deleteTask = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.params;

    // --- Validasi role ---
    if (user?.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Hanya admin yang bisa menghapus task." });
    }

    // --- Cek keberadaan task dulu ---
    const task = await Task.findById(taskId).select("_id");
    if (!task) {
      return res.status(404).json({ message: "Task tidak ditemukan." });
    }

    // --- Hapus (akan memicu hook deleteOne jika ada) ---
    await task.deleteOne();

    // NOTE: Jika ada file lampiran/relasi, bersihkan di hook deleteOne() schema Task
    // agar terjamin konsistensinya (misal hapus file S3/GridFS, hapus child docs, dsb).

    return res.status(200).json({
      message: "Task berhasil dihapus.",
      taskId,
    });
  } catch (error) {
    // Tangani CastError/ValidationError dsb dengan pesan yang bersih
    const isCastError = error?.name === "CastError";
    console.error("Error deleting task:", error);

    return res.status(isCastError ? 400 : 500).json({
      message: isCastError
        ? "ID task tidak valid."
        : "Terjadi kesalahan saat menghapus task.",
      error: error.message,
    });
  }
};

// @Desc    Statistik dashboard admin
// @Route   GET /api/tasks/admin-dashboard
// @Access  Private (admin)
const getAdminDashboardStats = async (req, res) => {
  try {
    // === 0. Validasi Role ===
    const { user } = req;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // === 1. Parameter Dasar ===
    const currentYear = new Date().getFullYear();
    const selectedYear = Number(req.query.year) || currentYear;

    const MAX_LIMIT = 100;
    const currentPage = Math.max(1, Number(req.query.page) || 1);
    const itemsPerPage = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || 5)
    );
    const skip = (currentPage - 1) * itemsPerPage;

    // === 2. Filter Tahun ===
    const startOfYear = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${selectedYear}-12-31T23:59:59.999Z`);
    const yearFilter = { createdAt: { $gte: startOfYear, $lte: endOfYear } };

    // === 3. Statistik Utama ===
    const [totalTasks, totalApproved, totalRejected, totalPending] =
      await Promise.all([
        Task.countDocuments(yearFilter),
        Task.countDocuments({
          ...yearFilter,
          approvals: { $elemMatch: { stage: "dikirim", status: "approved" } },
        }),
        Task.countDocuments({
          ...yearFilter,
          approvals: { $elemMatch: { status: "rejected" } },
        }),
        Task.countDocuments({
          ...yearFilter,
          approvals: {
            $elemMatch: {
              stage: "dikirim",
              $or: [{ status: "pending" }, { status: null }],
            },
          },
        }),
      ]);

    // === 4. Data per Jenis & Kecamatan ===
    const [tasksPerTitleAgg, tasksPerSubdistrictAgg] = await Promise.all([
      Task.aggregate([
        { $match: yearFilter },
        { $group: { _id: "$title", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: yearFilter },
        { $group: { _id: "$mainData.subdistrict", count: { $sum: 1 } } },
      ]),
    ]);

    const toObject = (arr, label = "Tidak Diketahui") =>
      arr.reduce((obj, i) => {
        obj[i._id || label] = i.count || 0;
        return obj;
      }, {});

    const tasksPerTitle = toObject(tasksPerTitleAgg);
    const tasksPerSubdistrict = toObject(tasksPerSubdistrictAgg);

    // === 5. Overdue Tasks (>7 hari belum selesai) ===
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const overdueFilter = {
      $and: [
        { createdAt: { $gte: startOfYear, $lte: endOfYear } },
        { createdAt: { $lte: sevenDaysAgo } },
      ],
      currentStage: { $ne: "selesai" },
    };

    const searchNopel = (req.query.nopel || "").trim();
    const nopelFilter = searchNopel
      ? {
          "mainData.nopel": {
            $regex: searchNopel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {};

    const [overdueCountAgg, overdueList] = await Promise.all([
      Task.aggregate([
        { $match: { ...overdueFilter, ...nopelFilter } },
        { $count: "total" },
      ]),
      Task.aggregate([
        { $match: { ...overdueFilter, ...nopelFilter } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: itemsPerPage },
        {
          $project: {
            _id: 1,
            title: 1,
            createdAt: 1,
            currentStage: 1,
            "mainData.nop": 1,
            "mainData.nopel": 1,
            additionalData: { $slice: ["$additionalData", 1] },
          },
        },
      ]),
    ]);

    const overdueTotal = overdueCountAgg?.[0]?.total || 0;

    // === 6. Statistik Mingguan (12 minggu terakhir) ===
    const endOfWeek = moment().endOf("isoWeek");
    const startOf12WeeksAgo = moment().subtract(11, "weeks").startOf("isoWeek");

    const weeklyAggregation = await Task.aggregate([
      {
        $match: {
          $and: [
            { createdAt: { $gte: startOfYear, $lte: endOfYear } },
            {
              createdAt: {
                $gte: startOf12WeeksAgo.toDate(),
                $lte: endOfWeek.toDate(),
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$createdAt" },
            week: { $isoWeek: "$createdAt" },
          },
          total: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.week": 1 } },
    ]);

    const weeklyStats = Array.from({ length: 12 }, (_, i) => {
      const startOfWeek = moment()
        .subtract(11 - i, "weeks")
        .startOf("isoWeek");
      const endOfThatWeek = startOfWeek.clone().endOf("isoWeek");

      const label = `${startOfWeek.format("DD")}–${endOfThatWeek.format(
        "DD MMM"
      )}`;

      const foundWeek = weeklyAggregation.find(
        (w) =>
          w._id.year === startOfWeek.isoWeekYear() &&
          w._id.week === startOfWeek.isoWeek()
      );

      return { label, total: foundWeek ? foundWeek.total : 0 };
    });

    // === 7. Response ===
    return res.status(200).json({
      year: selectedYear,
      page: currentPage,
      limit: itemsPerPage,
      overdueTotal,
      stats: {
        totalTasks,
        totalApproved,
        totalRejected,
        totalPending,
        tasksPerTitle,
        tasksPerSubdistrict,
      },
      overdueTasks: overdueList,
      weeklyStats,
    });
  } catch (error) {
    console.error("Error getting admin dashboard stats:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil dashboard admin",
      error: error?.message || String(error),
    });
  }
};

// @Deskripsi: Mendapatkan statistik dashboard
// @Route: GET /api/tasks/user-dashboard
// @Access: Private
const getUserDashboardStats = async (req, res) => {
  try {
    // === 0. Validasi User & Stage ===
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const stage = stageMap[(user.role || "").toLowerCase()];
    if (!stage) {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki stage yang sesuai." });
    }

    // === 1. Parameter Dasar & Tahun ===
    const currentYear = new Date().getFullYear();
    const selectedYear = Number(req.query.year) || currentYear;

    const startOfYear = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${selectedYear}-12-31T23:59:59.999Z`);
    const yearFilter = { createdAt: { $gte: startOfYear, $lte: endOfYear } };

    const MAX_LIMIT = 100;
    const currentPage = Math.max(1, Number(req.query.page) || 1);
    const itemsPerPage = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(req.query.limit) || 5)
    );
    const skip = (currentPage - 1) * itemsPerPage;

    // === 2. Filter Stage ===
    const approvedFilter = {
      ...yearFilter,
      approvals: { $elemMatch: { stage, status: "approved" } },
    };
    const rejectedFilter = {
      ...yearFilter,
      approvals: { $elemMatch: { stage, status: "rejected" } },
    };
    const pendingFilter = {
      ...yearFilter,
      approvals: {
        $elemMatch: {
          stage,
          $or: [
            { status: "pending" },
            { status: null },
            { status: { $exists: false } },
          ],
        },
      },
    };

    // === 3. Hitung Statistik Dasar ===
    const [totalApproved, totalRejected, totalPending] = await Promise.all([
      Task.countDocuments(approvedFilter),
      Task.countDocuments(rejectedFilter),
      Task.countDocuments(pendingFilter),
    ]);

    const totalTasks = totalApproved + totalRejected + totalPending;

    // === 4. Statistik per Jenis & Kecamatan ===
    const [titleAgg, subdistrictAgg] = await Promise.all([
      Task.aggregate([
        { $match: approvedFilter },
        { $group: { _id: "$title", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: approvedFilter },
        { $group: { _id: "$mainData.subdistrict", count: { $sum: 1 } } },
      ]),
    ]);

    const toObject = (arr, label = "Tidak Diketahui") =>
      arr.reduce((obj, i) => {
        obj[i._id || label] = i.count || 0;
        return obj;
      }, {});

    const tasksPerTitle = toObject(titleAgg);
    const tasksPerSubdistrict = toObject(subdistrictAgg);

    // === 5. Filter NOPel (Search) ===
    const searchNopel = String(req.query.nopel || "").trim();
    const nopelFilter = searchNopel
      ? {
          "mainData.nopel": {
            $regex: searchNopel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        }
      : {};

    // === 6. Ambil Daftar Approved Tasks ===
    const [approvedTotalAgg, approvedList] = await Promise.all([
      Task.aggregate([
        { $match: { ...approvedFilter, ...nopelFilter } },
        { $count: "total" },
      ]),
      Task.aggregate([
        { $match: { ...approvedFilter, ...nopelFilter } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: itemsPerPage },
        {
          $project: {
            _id: 1,
            title: 1,
            createdAt: 1,
            currentStage: 1,
            "mainData.nop": 1,
            "mainData.nopel": 1,
            additionalData: { $slice: ["$additionalData", 1] },
          },
        },
      ]),
    ]);

    const approvedTotal = approvedTotalAgg?.[0]?.total || 0;

    // === 7. Response ===
    return res.status(200).json({
      year: selectedYear,
      page: currentPage,
      limit: itemsPerPage,
      stage,
      approvedTotal,
      stats: {
        totalTasks,
        totalApproved,
        totalRejected,
        totalPending,
        tasksPerTitle,
        tasksPerSubdistrict,
      },
      approvedTasks: approvedList,
    });
  } catch (error) {
    console.error("Error getting user dashboard stats:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data dashboard user.",
      error: error?.message || String(error),
    });
  }
};

// @Deskripsi: Mendapatkan all task
// @Route: GET /api/tasks
// @Access: Private
const getAllTasks = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // --- Role-based filter
    const userRole = String(user.role || "").toLowerCase();
    const isAdmin = userRole === "admin";
    const query = {};

    if (!isAdmin) {
      const stage = stageMap[userRole];
      if (!stage) {
        return res.status(403).json({ message: "Role tidak dikenali." });
      }
      query.currentStage = stage;
    }

    // --- Extract filter params
    const { nopel, title, startDate, endDate } = req.query;

    if (nopel) {
      query["mainData.nopel"] = { $regex: String(nopel), $options: "i" };
    }

    if (title) {
      const normalizedTitle = String(title).replace(/[_\s]+/g, ".*");
      query.title = { $regex: normalizedTitle, $options: "i" };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);

      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }

    // --- Pagination setup
    const MAX_LIMIT = 100;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const skip = (page - 1) * limit;

    // --- Sorting setup
    const ALLOWED_SORT_FIELDS = ["createdAt"];
    const sortField = ALLOWED_SORT_FIELDS.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const sortOrder =
      String(req.query.order || "desc").toLowerCase() === "asc" ? 1 : -1;

    const sort = { [sortField]: sortOrder };

    // --- Query database
    const [tasks, totalCount] = await Promise.all([
      Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select({
          _id: 1,
          title: 1,
          createdAt: 1,
          currentStage: 1,
          approvals: 1,
          "mainData.nop": 1,
          "mainData.nopel": 1,
          additionalData: { $slice: ["$additionalData", 1] },
        })
        .lean(),
      Task.countDocuments(query),
    ]);

    // --- Enhance with readable status
    const formattedTasks = tasks.map((task) => {
      const hasRejection = task.approvals?.some(
        (approval) => approval.status === "rejected"
      );
      const isFinished =
        task.currentStage === "selesai" || task.isCompleted === true;

      let status = "Diproses";
      if (hasRejection) status = "Ditolak";
      else if (isFinished) status = "Selesai";

      return { ...task, status };
    });

    // --- Final response
    return res.status(200).json({
      page,
      limit,
      total: totalCount,
      sortBy: sortField,
      order: sortOrder === 1 ? "asc" : "desc",
      tasks: formattedTasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data task",
      error: error?.message || String(error),
    });
  }
};

// @Deskripsi: Mengambil 1 task berdasarkan ID (untuk halaman publik)
// @Route: GET /api/tasks/:id
// @Access: Public
const getTaskById = async (req, res) => {
  try {
    const user = req.user; // dari middleware protect
    if (!user) {
      return res
        .status(401)
        .json({ message: "Akses ditolak. Harap login terlebih dahulu." });
    }

    const { taskId } = req.params;
    if (!taskId) {
      return res.status(400).json({ message: "Parameter taskId wajib diisi." });
    }

    // Ambil data task (tanpa field internal seperti __v)
    const task = await Task.findById(taskId).select("-__v").lean();
    if (!task) {
      return res.status(404).json({ message: "Task tidak ditemukan." });
    }

    // Pastikan approvals valid array
    const approvals = Array.isArray(task.approvals) ? task.approvals : [];

    // Cek apakah ada tahap yang berstatus 'rejected'
    const rejectedApproval = approvals.find(
      (approval) => approval?.status === "rejected"
    );

    // Hindari cache data sensitif
    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      ...task,
      rejectedStage: rejectedApproval?.stage ?? null,
    });
  } catch (error) {
    console.error("Error getting task by ID:", error);

    // Tangani kesalahan ID tidak valid
    const isInvalidId = error?.name === "CastError";
    return res.status(isInvalidId ? 400 : 500).json({
      message: isInvalidId
        ? "ID task tidak valid."
        : "Terjadi kesalahan saat mengambil detail task.",
      error: error.message,
    });
  }
};

// @Deskripsi: Menampilkan kinerja semua user per stage dan per title
// @Route: GET /api/tasks/user-performance
// @Access: Private (admin saja)
const getAllUserPerformance = async (req, res) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Ambil semua task beserta approval dan user yang menyetujui
    const tasks = await Task.find({})
      .select(
        "title approvals.createdAt approvals.updatedAt approvals.approvedAt approvals.stage approvals.status approvals.approverId"
      )
      .populate("approvals.approverId", "name role")
      .lean();

    const SLA_DAYS = 2;
    const SLA_MS = SLA_DAYS * 24 * 60 * 60 * 1000;

    // Hanya 5 stage yang valid
    const stageOrderInPerformance = [
      "diinput",
      "ditata",
      "diteliti",
      "diarsipkan",
      "dikirim",
    ];

    // Struktur data KPI
    const performanceByStageAndUser = {};
    const globalDurations = [];

    for (const stage of stageOrderInPerformance) {
      performanceByStageAndUser[stage] = {};
    }

    // Iterasi semua task
    for (const task of tasks) {
      const approvals = task.approvals || [];

      // Cari waktu dari tahap awal sampai dikirim (untuk rata-rata global)
      const startApproval = approvals.find((a) => a.stage === "diinput");
      const endApproval = approvals.find((a) => a.stage === "dikirim");

      if (
        startApproval &&
        endApproval &&
        endApproval.approvedAt &&
        startApproval.createdAt
      ) {
        const totalTimeMs =
          new Date(endApproval.approvedAt) - new Date(startApproval.createdAt);
        if (totalTimeMs > 0) globalDurations.push(totalTimeMs);
      }

      // Hitung KPI per user per tahap
      for (const approval of approvals) {
        const stage = approval.stage;
        const approver = approval.approverId;

        if (!stageOrderInPerformance.includes(stage) || !approver) continue; // Hanya stage valid

        const userId = String(approver._id);
        const userName = approver.name;
        const userRole = approver.role;

        if (!performanceByStageAndUser[stage][userId]) {
          performanceByStageAndUser[stage][userId] = {
            userId,
            userName,
            userRole,
            totalTasks: 0,
            approvedCount: 0,
            rejectedCount: 0,
            pendingCount: 0,
            totalProcessingTimeMs: 0,
            onTimeCount: 0,
          };
        }

        const record = performanceByStageAndUser[stage][userId];
        record.totalTasks += 1;

        if (approval.status === "approved") {
          record.approvedCount += 1;

          const startTime = approval.createdAt || approval.updatedAt;
          const endTime = approval.approvedAt || approval.updatedAt;

          if (startTime && endTime) {
            const duration = new Date(endTime) - new Date(startTime);
            if (duration > 0 && Number.isFinite(duration)) {
              record.totalProcessingTimeMs += duration;
              if (duration <= SLA_MS) record.onTimeCount += 1;
            }
          }
        } else if (approval.status === "rejected") {
          record.rejectedCount += 1;
        } else {
          record.pendingCount += 1;
        }
      }
    }

    // Ubah ke array untuk dikirim ke frontend
    const kpiPerStage = stageOrderInPerformance.map((stage) => {
      const users = Object.values(performanceByStageAndUser[stage] || {});
      return {
        stage,
        users: users.map((user) => {
          const avgProcessingTimeMs =
            user.approvedCount > 0
              ? user.totalProcessingTimeMs / user.approvedCount
              : 0;
          const avgDays = +(avgProcessingTimeMs / 86_400_000).toFixed(2);

          const onTimeRate =
            user.approvedCount > 0
              ? (user.onTimeCount / user.approvedCount) * 100
              : 0;

          return {
            userId: user.userId,
            userName: user.userName,
            userRole: user.userRole,
            totalTasks: user.totalTasks,
            approvedCount: user.approvedCount,
            rejectedCount: user.rejectedCount,
            pendingCount: user.pendingCount,
            avgProcessingTimeDays: avgDays,
            onTimeRate: +onTimeRate.toFixed(2),
          };
        }),
      };
    });

    // Hitung rata-rata global dari awal sampai tahap dikirim
    const globalAvgMs =
      globalDurations.length > 0
        ? globalDurations.reduce((a, b) => a + b, 0) / globalDurations.length
        : 0;
    const globalAvgDays = +(globalAvgMs / 86_400_000).toFixed(2);

    res.status(200).json({
      summary: {
        totalTasks: tasks.length,
        avgDaysUntilSent: globalAvgDays,
        withinTarget: globalAvgDays <= 7,
      },
      kpiPerStage,
    });
  } catch (error) {
    console.error("Error in getAllUserPerformance:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil performa user",
      error: error?.message || String(error),
    });
  }
};

module.exports = {
  createTask,
  approveTask,
  updateTask,
  deleteTask,
  getAdminDashboardStats,
  getUserDashboardStats,
  getAllTasks,
  getTaskById,
  getAllUserPerformance,
};
