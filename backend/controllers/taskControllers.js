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

// @Deskripsi Membuat tugas baru
// @Route     POST /api/tasks/
// @Access    Private (hanya admin dan approver input yang bisa membuat task)
const createTask = async (req, res) => {
  try {
    const user = req.user;
    const { title, mainData, additionalData, currentStage } = req.body;

    // Validasi role
    if (
      user.role !== "admin" &&
      !(user.role === "penginput" && currentStage === "diinput")
    ) {
      return res
        .status(403) //forbidden
        .json({
          message: "Anda tidak memiliki izin untuk membuat berkas ini.",
        });
    }

    // Validasi input
    if (!title || !mainData || !additionalData) {
      return res.status(400).json({
        message: "Field title, mainData, dan additionalData wajib diisi.", //request yang tidak valid.
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

    // Cek apakah setiap fieldnya diisi atau tidak
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

    // Validasi setiap additionalData
    for (const [index, item] of additionalData.entries()) {
      //mengembalikan iterator berisi pasangan [index, value]
      if (
        !item.newName ||
        typeof item.landWide !== "number" ||
        typeof item.buildingWide !== "number" ||
        !item.certificate
      ) {
        return res.status(400).json({
          message: `Field newName, landWide, buildingWide, certificate wajib diisi pada additionalData index ${index}.`,
        });
      }
    }

    // Hasilkan approvals sesuai schema (stageToRoleMap sudah harus ada)
    const approvals = Object.entries(stageToRoleMap).map(
      //mengembalikan iterator berisi pasangan [stage, approverRole] (menghasilkan array of object)
      ([stage, approverRole]) => ({
        stage,
        approverRole,
        approverId: null,
        approvedAt: null,
        note: "",
        status: "pending",
      })
    );

    // Buat task
    const task = new Task({
      title,
      mainData,
      additionalData,
      currentStage: currentStage || "diinput",
      createdBy: user._id,
      approvals,
    });

    await task.save();

    return res.status(201).json({
      //dibuat
      message: "Berkas berhasil dibuat.",
      task,
    });
  } catch (error) {
    console.error("Error membuat berkas:", error);
    return res.status(500).json({
      //server error
      message: "Terjadi kesalahan saat membuat berkas.",
      error: error.message,
    });
  }
};

// @Deskripsi Mengupdate approval
// @Route     PATCH /api/tasks/:id/approve
// @Access    Private (hanya admin dan approver pada stagenya yang bisa approve)
// pastikan sudah: const mongoose = require("mongoose");
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
        "currentStage approvals isCompleted rejectedStage title mainData.nop mainData.nopel createdAt"
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
      (a) => a?.stage === currentStage
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
    const user = req.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Ambil tahun dari query (opsional)
    const year = parseInt(req.query.year, 10);

    // Pagination aman untuk UI
    const MAX_LIMIT = 100;
    const page = Math.max(1, parseInt(req.query.page, 5) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(req.query.limit, 5) || 5)
    );
    const skip = (page - 1) * limit;

    // ===== Filter tahun (opsional) =====
    let yearFilter = {};
    if (!isNaN(year)) {
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);
      yearFilter = { createdAt: { $gte: startOfYear, $lte: endOfYear } };
    }

    // ===== 1) Statistik Umum =====
    const [totalTasks, totalApproved, totalRejected, totalPending] =
      await Promise.all([
        Task.countDocuments({ ...yearFilter }),
        Task.countDocuments({
          approvals: { $elemMatch: { stage: "dikirim", status: "approved" } },
          ...yearFilter,
        }),
        Task.countDocuments({
          approvals: { $elemMatch: { status: "rejected" } },
          ...yearFilter,
        }),
        Task.countDocuments({
          approvals: {
            $elemMatch: {
              stage: "dikirim",
              $or: [{ status: "pending" }, { status: null }],
            },
          },
          ...yearFilter,
        }),
      ]);

    const [tasksPerTitleAgg, tasksPerSubdistrictAgg] = await Promise.all([
      Task.aggregate([
        { $match: { ...yearFilter } },
        { $group: { _id: "$title", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { ...yearFilter } },
        { $group: { _id: "$mainData.subdistrict", count: { $sum: 1 } } },
      ]),
    ]);

    const tasksPerTitle = {};
    for (const it of tasksPerTitleAgg) {
      tasksPerTitle[it._id || "Tidak Diketahui"] = it.count || 0;
    }

    const tasksPerSubdistrict = {};
    for (const it of tasksPerSubdistrictAgg) {
      tasksPerSubdistrict[it._id || "Tidak Diketahui"] = it.count || 0;
    }

    // ===== 2) Overdue tasks (>14 hari belum selesai) =====
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const overdueBaseMatch = {
      createdAt: { $lte: twoWeeksAgo },
      currentStage: { $ne: "selesai" },
      ...yearFilter,
    };

    const rawNopel = String(req.query.nopel || "").trim();
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nopelMatch =
      rawNopel.length > 0
        ? { "mainData.nopel": { $regex: escapeRegex(rawNopel), $options: "i" } }
        : {};

    const overdueTotalAgg = await Task.aggregate([
      { $match: { ...overdueBaseMatch, ...nopelMatch } },
      { $count: "total" },
    ]);
    const overdueTotal = overdueTotalAgg?.[0]?.total || 0;

    const overdueTasks = await Task.aggregate([
      { $match: { ...overdueBaseMatch, ...nopelMatch } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
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
    ]);

    // ===== 3) Weekly Stats (12 minggu terakhir) =====
    const now = moment().endOf("isoWeek");
    const start = moment().subtract(11, "weeks").startOf("isoWeek");

    const weeklyRaw = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: start.toDate(), $lte: now.toDate() },
          ...yearFilter,
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

    // Normalisasi agar minggu kosong tetap muncul
    const weeklyStats = [];
    for (let i = 0; i < 12; i++) {
      const weekStart = moment()
        .subtract(11 - i, "weeks")
        .startOf("isoWeek");
      const weekKey = {
        year: weekStart.isoWeekYear(),
        week: weekStart.isoWeek(),
      };
      const label = `${weekStart.format("DD MMM")} - ${weekStart
        .clone()
        .endOf("isoWeek")
        .format("DD MMM")}`;

      const found = weeklyRaw.find(
        (s) => s._id.year === weekKey.year && s._id.week === weekKey.week
      );

      weeklyStats.push({
        label,
        total: found ? found.total : 0,
      });
    }

    // ===== Response =====
    return res.status(200).json({
      year: isNaN(year) ? "all" : year,
      page,
      limit,
      overdueTotal,
      stats: {
        totalTasks,
        totalApproved,
        totalRejected,
        totalPending,
        tasksPerTitle,
        tasksPerSubdistrict,
      },
      overdueTasks,
      weeklyStats, // ← tambahan baru
    });
  } catch (error) {
    console.error("Error getting admin dashboard stats:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil dashboard admin",
      error: error?.message || String(error),
    });
  }
};

// const getAdminDashboardStats = async (req, res) => {
//   try {
//     const user = req.user;
//     if (!user || user.role !== "admin") {
//       return res.status(403).json({ message: "Forbidden" });
//     }

//     // Pagination aman untuk UI
//     const MAX_LIMIT = 100;
//     const page = Math.max(1, parseInt(req.query.page, 5) || 1);
//     const limit = Math.min(
//       MAX_LIMIT,
//       Math.max(1, parseInt(req.query.limit, 5) || 5)
//     );
//     const skip = (page - 1) * limit;

//     // ===== 1) Stats umum (GLOBAL; tidak terpengaruh filter NOPel) =====
//     const [totalTasks, totalApproved, totalRejected, totalPending] =
//       await Promise.all([
//         Task.countDocuments(),
//         // approved khusus stage "dikirim" (tetap)
//         Task.countDocuments({
//           approvals: { $elemMatch: { stage: "dikirim", status: "approved" } },
//         }),
//         // rejected di SEMUA stage
//         Task.countDocuments({
//           approvals: { $elemMatch: { status: "rejected" } },
//         }),
//         // pending khusus stage "dikirim" (tetap)
//         Task.countDocuments({
//           approvals: {
//             $elemMatch: {
//               stage: "dikirim",
//               $or: [{ status: "pending" }, { status: null }],
//             },
//           },
//         }),
//       ]);

//     const [tasksPerTitleAgg, tasksPerSubdistrictAgg] = await Promise.all([
//       Task.aggregate([{ $group: { _id: "$title", count: { $sum: 1 } } }]),
//       Task.aggregate([
//         { $group: { _id: "$mainData.subdistrict", count: { $sum: 1 } } },
//       ]),
//     ]);

//     const tasksPerTitle = {};
//     for (const it of tasksPerTitleAgg) {
//       tasksPerTitle[it._id || "Tidak Diketahui"] = it.count || 0;
//     }

//     const tasksPerSubdistrict = {};
//     for (const it of tasksPerSubdistrictAgg) {
//       tasksPerSubdistrict[it._id || "Tidak Diketahui"] = it.count || 0;
//     }

//     // ===== 2) Overdue tasks (>14 hari, belum "selesai") + pagination + SEARCH by NOPel =====
//     const twoWeeksAgo = new Date();
//     twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

//     const overdueBaseMatch = {
//       createdAt: { $lte: twoWeeksAgo },
//       currentStage: { $ne: "selesai" },
//     };

//     // ---- Filter by NOPel (opsional, partial, case-insensitive) ----
//     const rawNopel = String(req.query.nopel || "").trim();
//     const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
//     const nopelMatch =
//       rawNopel.length > 0
//         ? { "mainData.nopel": { $regex: escapeRegex(rawNopel), $options: "i" } }
//         : {};

//     // Total baris (untuk pagination) — ikut filter NOPel kalau ada
//     const overdueTotalAgg = await Task.aggregate([
//       { $match: { ...overdueBaseMatch, ...nopelMatch } },
//       { $count: "total" },
//     ]);
//     const overdueTotal = overdueTotalAgg?.[0]?.total || 0;

//     // Ambil data terpage (ikut filter NOPel kalau ada)
//     const overdueTasks = await Task.aggregate([
//       { $match: { ...overdueBaseMatch, ...nopelMatch } },
//       { $sort: { createdAt: -1 } },
//       { $skip: skip },
//       { $limit: limit },
//       {
//         $project: {
//           _id: 1,
//           title: 1,
//           createdAt: 1,
//           currentStage: 1,
//           "mainData.nop": 1,
//           "mainData.nopel": 1,
//           additionalData: { $slice: ["$additionalData", 1] },
//         },
//       },
//     ]);

//     return res.status(200).json({
//       page,
//       limit,
//       overdueTotal, // total baris setelah filter NOPel (jika ada)
//       stats: {
//         totalTasks, // global
//         totalApproved, // global
//         totalRejected, // global (all-stage)
//         totalPending, // global
//         tasksPerTitle, // global
//         tasksPerSubdistrict, // global
//       },
//       overdueTasks, // hasil terfilter & terpage
//     });
//   } catch (error) {
//     console.error("Error getting admin dashboard stats:", error);
//     return res.status(500).json({
//       message: "Terjadi kesalahan saat mengambil dashboard admin",
//       error: error?.message || String(error),
//     });
//   }
// };

// @Deskripsi: Mendapatkan statistik dashboard
// @Route: GET /api/tasks/user-dashboard
// @Access: Private
const getUserDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Stage selalu diambil dari role; tidak ada default.
    const stage = stageMap[(user.role || "").toLowerCase()];
    if (!stage) {
      return res
        .status(200)
        .json({ message: "Anda tidak ada di stage manapun" });
    }

    // Pagination aman
    const MAX_LIMIT = 100;
    const page = Math.max(1, parseInt(req.query.page, 5) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(req.query.limit, 5) || 5)
    );
    const skip = (page - 1) * limit;

    // -------- STATISTIK (hanya untuk stage user) --------
    const stageApprovedMatch = {
      approvals: { $elemMatch: { stage, status: "approved" } },
    };
    const stageRejectedMatch = {
      approvals: { $elemMatch: { stage, status: "rejected" } },
    };
    const stagePendingMatch = {
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

    const [totalApproved, totalRejected, totalPending] = await Promise.all([
      Task.countDocuments(stageApprovedMatch),
      Task.countDocuments(stageRejectedMatch),
      Task.countDocuments(stagePendingMatch),
    ]);
    const totalTask = totalApproved + totalRejected + totalPending;

    // Per title (yang sudah approved di stage user)
    const tasksPerTitleAgg = await Task.aggregate([
      { $match: stageApprovedMatch },
      { $group: { _id: "$title", count: { $sum: 1 } } },
    ]);

    // Per kecamatan (yang sudah approved di stage user)
    const tasksPerSubdistrictAgg = await Task.aggregate([
      { $match: stageApprovedMatch },
      { $group: { _id: "$mainData.subdistrict", count: { $sum: 1 } } },
    ]);

    const tasksPerTitle = {};
    for (const it of tasksPerTitleAgg) {
      tasksPerTitle[it._id || "Tidak Diketahui"] = it.count || 0;
    }
    const tasksPerSubdistrict = {};
    for (const it of tasksPerSubdistrictAgg) {
      tasksPerSubdistrict[it._id || "Tidak Diketahui"] = it.count || 0;
    }

    // -------- DAFTAR SEMUA DOKUMEN YG PERNAH APPROVED (stage manapun) + search NOPel --------
    const rawNopel = String(req.query.nopel || "").trim();
    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const nopelMatch = rawNopel
      ? { "mainData.nopel": { $regex: escapeRegex(rawNopel), $options: "i" } }
      : {};

    const approvedAnyStageMatch = {
      approvals: { $elemMatch: { status: "approved" } },
    };

    // Total untuk pagination (ikut filter nopel)
    const approvedTotalAgg = await Task.aggregate([
      { $match: { ...approvedAnyStageMatch, ...nopelMatch } },
      { $count: "total" },
    ]);
    const approvedTotal = approvedTotalAgg?.[0]?.total || 0;

    // Ambil daftar (urut berdasarkan approved terbaru pada approval manapun)
    const approvedTasks = await Task.aggregate([
      { $match: { ...approvedAnyStageMatch, ...nopelMatch } },
      {
        $addFields: {
          approvedItems: {
            $filter: {
              input: "$approvals",
              as: "a",
              cond: { $eq: ["$$a.status", "approved"] },
            },
          },
        },
      },
      {
        $addFields: {
          latestApprovedAt: {
            $max: {
              $map: {
                input: "$approvedItems",
                as: "ai",
                in: { $ifNull: ["$$ai.updatedAt", "$$ai.createdAt"] },
              },
            },
          },
        },
      },
      { $sort: { latestApprovedAt: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          createdAt: 1,
          currentStage: 1,
          "mainData.nop": 1,
          "mainData.nopel": 1,
          additionalData: { $slice: ["$additionalData", 1] },
          latestApprovedAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      page,
      limit,
      approvedTotal, // total daftar “semua yang pernah approved”
      stage, // diambil dinamis dari role
      stats: {
        totalTask, // akumulasi status pada stage user
        totalApproved, // approved di stage user
        totalRejected, // rejected di stage user
        totalPending, // pending/null di stage user
        tasksPerTitle, // hanya yang approved di stage user
        tasksPerSubdistrict, // hanya yang approved di stage user
      },
      approvedTasks, // list: approved di stage manapun, bisa di-search NOPel
    });
  } catch (error) {
    console.error("Error getting user dashboard stats:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil dashboard user",
      error: error?.message || String(error),
    });
  }
};

// @Deskripsi: Mendapatkan all task
// @Route: GET /api/tasks
// @Access: Private
const getAllTask = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const isAdmin = String(user.role || "").toLowerCase() === "admin";
    const query = {};
    if (!isAdmin) {
      const stage = stageMap[(user.role || "").toLowerCase()];
      if (!stage)
        return res.status(403).json({ message: "Role tidak dikenali." });
      query.currentStage = stage;
    }

    // --- Filters
    const { nopel, title, startDate, endDate } = req.query;

    if (nopel) {
      query["mainData.nopel"] = { $regex: String(nopel), $options: "i" };
    }

    if (title) {
      const normalized = String(title).replace(/[_\s]+/g, ".*");
      query.title = { $regex: normalized, $options: "i" };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // --- Pagination & Sorting
    const MAX_LIMIT = 100;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const skip = (page - 1) * limit;

    const allowSortBy = new Set(["createdAt"]);
    const sortBy = allowSortBy.has(String(req.query.sortBy))
      ? String(req.query.sortBy)
      : "createdAt";
    const order =
      String(req.query.order || "desc").toLowerCase() === "asc" ? 1 : -1;
    const sort = { [sortBy]: order };

    // --- Query tasks
    const [tasks, total] = await Promise.all([
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

    // --- Tambahkan status human-readable (ditolak/diproses/selesai)
    const enhancedTasks = tasks.map((task) => {
      let status = "Diproses"; // default

      const isRejected = task.approvals?.some((a) => a.status === "rejected");
      const isCompleted =
        task.currentStage === "selesai" || task.isCompleted === true;

      if (isRejected) status = "Ditolak";
      else if (isCompleted) status = "Selesai";

      return {
        ...task,
        status,
      };
    });

    return res.status(200).json({
      page,
      limit,
      total,
      sortBy,
      order: order === 1 ? "asc" : "desc",
      tasks: enhancedTasks,
    });
  } catch (error) {
    console.error("Error getting all tasks:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data task",
      error: error?.message || String(error),
    });
  }
};

// const getAllTask = async (req, res) => {
//   try {
//     const user = req.user;
//     if (!user) return res.status(401).json({ message: "Unauthorized" });

//     // --- Role → stage filter (non-admin dibatasi stage)
//     const isAdmin = String(user.role || "").toLowerCase() === "admin";
//     const query = {};
//     if (!isAdmin) {
//       const stage = stageMap[(user.role || "").toLowerCase()];
//       if (!stage)
//         return res.status(403).json({ message: "Role tidak dikenali." });
//       query.currentStage = stage;
//     }

//     // --- Filters
//     const { nopel, title, startDate, endDate } = req.query;

//     if (nopel) {
//       query["mainData.nopel"] = { $regex: String(nopel), $options: "i" };
//     }

//     if (title) {
//       // ganti spasi/underscore jadi wildcard agar fleksibel
//       const normalized = String(title).replace(/[_\s]+/g, ".*");
//       query.title = { $regex: normalized, $options: "i" };
//     }

//     if (startDate || endDate) {
//       query.createdAt = {};
//       if (startDate) query.createdAt.$gte = new Date(startDate);
//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         query.createdAt.$lte = end;
//       }
//     }

//     // --- Pagination & Sorting (aman untuk produksi)
//     const MAX_LIMIT = 100;
//     const page = Math.max(1, parseInt(req.query.page, 10) || 1);
//     const limit = Math.min(
//       MAX_LIMIT,
//       Math.max(1, parseInt(req.query.limit, 10) || 10)
//     );
//     const skip = (page - 1) * limit;

//     // hanya izinkan sortBy tertentu (di sini fokus createdAt)
//     const allowSortBy = new Set(["createdAt"]);
//     const sortBy = allowSortBy.has(String(req.query.sortBy))
//       ? String(req.query.sortBy)
//       : "createdAt";

//     // order: asc|desc → 1|-1 (default desc)
//     const order =
//       String(req.query.order || "desc").toLowerCase() === "asc" ? 1 : -1;
//     const sort = { [sortBy]: order };

//     // --- Query & total (parallel)
//     const [tasks, total] = await Promise.all([
//       Task.find(query)
//         .sort(sort)
//         .skip(skip)
//         .limit(limit)
//         .select({
//           _id: 1,
//           title: 1,
//           createdAt: 1,
//           currentStage: 1,
//           "mainData.nop": 1,
//           "mainData.nopel": 1,
//           additionalData: { $slice: ["$additionalData", 1] }, // ramping: ambil elemen pertama
//         })
//         .lean(),
//       Task.countDocuments(query),
//     ]);

//     return res.status(200).json({
//       page,
//       limit,
//       total, // total baris (tanpa paginasi)
//       sortBy, // echo back agar mudah di UI
//       order: order === 1 ? "asc" : "desc",
//       tasks,
//     });
//   } catch (error) {
//     console.error("Error getting all tasks:", error);
//     return res.status(500).json({
//       message: "Terjadi kesalahan saat mengambil data task",
//       error: error?.message || String(error),
//     });
//   }
// };

// @Deskripsi: Mengambil 1 task berdasarkan ID (untuk halaman publik)
// @Route: GET /api/tasks/:id
// @Access: Public
const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Ambil data; exclude __v (opsional)
    const task = await Task.findById(taskId).select("-__v").lean();
    if (!task) {
      return res.status(404).json({ message: "Task tidak ditemukan." });
    }

    // Hitung rejectedStage secara aman
    const approvals = Array.isArray(task.approvals) ? task.approvals : [];
    const rejectedApproval = approvals.find((a) => a?.status === "rejected");

    // Hindari cache data sensitif
    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      ...task,
      rejectedStage: rejectedApproval?.stage ?? null,
    });
  } catch (error) {
    // Tangani CastError dsb dengan status yang tepat
    const isCastError = error?.name === "CastError";
    console.error("Error getting task by ID:", error);
    return res.status(isCastError ? 400 : 500).json({
      message: isCastError
        ? "ID task tidak valid."
        : "Terjadi kesalahan saat mengambil detail task.",
      error: error.message,
    });
  }
};

// @Deskripsi: Menampilkan kinerja semua user per stage dan per title
// @Route: GET /api/tasks/user-performance
// @Access: Private (admin saja)
// Pastikan tersedia:
// const Task = require(".../models/Task");
// const stageOrder = ["diinput","ditata","diteliti","diarsipkan","dikirim","selesai"];
const getAllUserPerformance = async (req, res) => {
  try {
    const me = req.user;
    if (!me || me.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const tasks = await Task.find({})
      .select(
        "title approvals.stage approvals.status approvals.approvedAt approvals.createdAt approvals.updatedAt approvals.approverId"
      )
      .populate("approvals.approverId", "name role")
      .lean();

    // konfigurasi awal
    const SLA_DAYS = 2; // contoh SLA 2 hari
    const SLA_MS = SLA_DAYS * 24 * 60 * 60 * 1000;

    const kpi = {}; // hasil utama KPI per stage
    const complianceResults = { total: 0, compliant: 0 };

    for (const stage of stageOrder) {
      kpi[stage] = {
        stage,
        totalTasks: 0,
        approvedCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        totalProcessingTimeMs: 0,
        onTimeCount: 0,
      };
    }

    for (const task of tasks) {
      const approvals = task.approvals || [];

      // (1) Compliance Check: urutan stage harus sesuai stageOrder
      let lastStageIdx = -1;
      let compliant = true;

      for (const a of approvals) {
        const currentIdx = stageOrder.indexOf(a.stage);
        if (currentIdx < lastStageIdx) {
          compliant = false;
          break;
        }
        lastStageIdx = currentIdx;
      }

      complianceResults.total += 1;
      if (compliant) complianceResults.compliant += 1;

      // (2) Hitung per stage
      for (const a of approvals) {
        const stage = a.stage;
        const stageStat = kpi[stage];
        if (!stageStat) continue;

        stageStat.totalTasks += 1;

        if (a.status === "approved") {
          stageStat.approvedCount += 1;
          const t0 = a.createdAt || a.updatedAt;
          const t1 = a.approvedAt || a.updatedAt;
          if (t0 && t1) {
            const delta = new Date(t1).getTime() - new Date(t0).getTime();
            if (delta > 0 && Number.isFinite(delta)) {
              stageStat.totalProcessingTimeMs += delta;
              if (delta <= SLA_MS) stageStat.onTimeCount += 1;
            }
          }
        } else if (a.status === "rejected") {
          stageStat.rejectedCount += 1;
        } else if (a.status === "pending") {
          stageStat.pendingCount += 1;
        }
      }
    }

    // (3) Kalkulasi rasio KPI
    const stageResults = stageOrder.map((stage) => {
      const s = kpi[stage];
      const throughputRate =
        s.totalTasks > 0 ? (s.approvedCount / s.totalTasks) * 100 : 0;
      const rejectionRate =
        s.totalTasks > 0 ? (s.rejectedCount / s.totalTasks) * 100 : 0;
      const onTimeRate =
        s.approvedCount > 0 ? (s.onTimeCount / s.approvedCount) * 100 : 0;
      const avgProcessingTimeMs =
        s.approvedCount > 0 ? s.totalProcessingTimeMs / s.approvedCount : 0;
      const avgDays = +(avgProcessingTimeMs / 86_400_000).toFixed(2);

      return {
        stage: s.stage,
        totalTasks: s.totalTasks,
        approvedCount: s.approvedCount,
        rejectedCount: s.rejectedCount,
        pendingCount: s.pendingCount,
        throughputRate: +throughputRate.toFixed(2),
        rejectionRate: +rejectionRate.toFixed(2),
        onTimeRate: +onTimeRate.toFixed(2),
        avgProcessingTimeDays: avgDays,
      };
    });

    // (4) Compliance Rate keseluruhan
    const complianceRate =
      complianceResults.total > 0
        ? (complianceResults.compliant / complianceResults.total) * 100
        : 0;

    // (5) Hasil akhir
    res.status(200).json({
      summary: {
        totalTasks: complianceResults.total,
        complianceRate: +complianceRate.toFixed(2),
      },
      kpiPerStage: stageResults,
    });
  } catch (error) {
    console.error("Error in getAllUserPerformance:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengambil performa user",
      error: error?.message || String(error),
    });
  }
};

// const getAllUserPerformance = async (req, res) => {
//   try {
//     const me = req.user;
//     if (!me && me.role !== "admin") return res.status(401).json({ message: "Unauthorized" });

//     if (!Array.isArray(stageOrder) || stageOrder.length < 2) {
//       return res.status(500).json({ message: "Konfigurasi stageOrder tidak valid." });
//     }

//     // Ambil data minimal + nama/role approver (untuk rekap & performa)
//     const tasks = await Task.find({})
//       .select(
//         "title approvals.stage approvals.status approvals.approvedAt approvals.createdAt approvals.updatedAt approvals.approverId"
//       )
//       .populate("approvals.approverId", "name role")
//       .lean();

//     // (a) Rekap APPROVED per stage → title
//     // Hanya approved yang dihitung pada 'count'. Admin tidak dimasukkan di daftar users.
//     const statsPerStage = Object.create(null);
//     // agregasi internal untuk daftar user non-admin per stage-title
//     const userAgg = Object.create(null); // userAgg[stage][title][userId] = { userId, name, role, count }

//     // (b) Performa user non-admin: rata-rata waktu dari stage → stage berikutnya
//     const performance = Object.create(null); // performance[stage][userId] = { userId, name, role, totalMs, n }

//     const getApprovalFor = (approvals = [], stage) =>
//       approvals.find((a) => a?.stage === stage);
//     const pickTime = (a) => a?.approvedAt || a?.updatedAt || a?.createdAt || null;

//     for (const task of tasks) {
//       const title = task?.title || "Tidak diketahui";
//       const approvals = Array.isArray(task?.approvals) ? task.approvals : [];

//       for (const a of approvals) {
//         const stage = a?.stage;
//         if (!stage) continue;

//         // siapkan container rekap
//         if (!statsPerStage[stage]) statsPerStage[stage] = Object.create(null);
//         if (!statsPerStage[stage][title]) {
//           statsPerStage[stage][title] = {
//             approved: { count: 0, users: [] },
//             rejected: { count: 0, users: [] }, // diset nol agar kompatibel UI lama
//             pending:  { count: 0, users: [] }, // diset nol agar kompatibel UI lama
//             total: 0,
//           };
//         }
//         if (!userAgg[stage]) userAgg[stage] = Object.create(null);
//         if (!userAgg[stage][title]) userAgg[stage][title] = Object.create(null);

//         // (a) Hitung hanya yang approved
//         if (a?.status === "approved") {
//           // Tambah jumlah dokumen approved (independen dari role, termasuk admin)
//           const slot = statsPerStage[stage][title];
//           slot.approved.count += 1;
//           slot.total = slot.approved.count;

//           // Catat user non-admin
//           const approver = a?.approverId;
//           const role = String(approver?.role || "").toLowerCase();
//           if (approver?._id && role !== "admin") {
//             const uid = String(approver._id);
//             if (!userAgg[stage][title][uid]) {
//               userAgg[stage][title][uid] = {
//                 userId: approver._id,
//                 name: approver.name || "Tidak diketahui",
//                 role: approver.role || "",
//                 count: 0,
//               };
//             }
//             userAgg[stage][title][uid].count += 1;
//           }
//         }

//         // (b) Performa: durasi approved stage ini → approved stage berikutnya (non-admin saja)
//         if (a?.status === "approved" && a?.approverId) {
//           const approverRole = String(a.approverId.role || "").toLowerCase();
//           if (approverRole === "admin") continue; // exclude admin dari metrik performa

//           const t0 = pickTime(a);
//           if (!t0) continue;

//           const idx = stageOrder.indexOf(stage);
//           if (idx >= 0 && idx < stageOrder.length - 1) {
//             const nextStage = stageOrder[idx + 1];
//             const nextApproval = getApprovalFor(approvals, nextStage);
//             const t1 = pickTime(nextApproval);

//             if (nextApproval?.status === "approved" && t1) {
//               const deltaMs = new Date(t1).getTime() - new Date(t0).getTime();
//               if (Number.isFinite(deltaMs) && deltaMs > 0) {
//                 if (!performance[stage]) performance[stage] = Object.create(null);
//                 const uid = String(a.approverId._id);
//                 if (!performance[stage][uid]) {
//                   performance[stage][uid] = {
//                     userId: a.approverId._id,
//                     name: a.approverId.name || "Tidak diketahui",
//                     role: a.approverId.role || "",
//                     totalMs: 0,
//                     n: 0,
//                   };
//                 }
//                 performance[stage][uid].totalMs += deltaMs;
//                 performance[stage][uid].n += 1;
//               }
//             }
//           }
//         }
//       }
//     }

//     // Konversi agregat user → array terurut (kontributor terbanyak dulu)
//     for (const stage of Object.keys(userAgg)) {
//       for (const title of Object.keys(userAgg[stage])) {
//         const users = Object.values(userAgg[stage][title]).sort(
//           (a, b) => b.count - a.count || a.name.localeCompare(b.name)
//         );
//         statsPerStage[stage][title].approved.users = users;
//       }
//     }

//     // Rata-rata performa & urutkan tercepat → terlama
//     const performancePerStage = Object.create(null);
//     for (const stage of Object.keys(performance)) {
//       const byUser = Object.values(performance[stage]).map((p) => {
//         const avgMs = p.n > 0 ? Math.round(p.totalMs / p.n) : 0;
//         return {
//           userId: p.userId,
//           name: p.name,
//           role: p.role,
//           count: p.n,
//           avgMs,
//           avgHours: +(avgMs / 3_600_000).toFixed(2),
//           avgDays:  +(avgMs / 86_400_000).toFixed(2),
//         };
//       });
//       byUser.sort((a, b) => a.avgMs - b.avgMs);
//       performancePerStage[stage] = { byUser };
//     }

//     res.set("Cache-Control", "no-store");
//     return res.status(200).json({
//       statsPerStage,        // count = jumlah approved di stage tsb per title (role apa pun), users = non-admin saja
//       performancePerStage,  // metrik waktu stage→next per user non-admin
//     });
//   } catch (error) {
//     console.error("Error in getAllUserPerformance:", error);
//     return res.status(500).json({
//       message: "Terjadi kesalahan saat mengambil performa semua user",
//       error: error?.message || String(error),
//     });
//   }
// };

// @Desc: Mengambil jumlah task yang dibuat per minggu (12 minggu terakhir)
// @Route: GET /api/tasks/stats/weekly
// @Access: Private (admin only)
const getWeeklyTaskStats = async (req, res) => {
  try {
    const user = req.user;

    // Hanya admin yang boleh akses
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Akses ditolak. Hanya admin yang diperbolehkan." });
    }

    // Hitung dari 12 minggu terakhir (3 bulan)
    const now = moment().endOf("isoWeek"); // akhir minggu ini
    const start = moment().subtract(11, "weeks").startOf("isoWeek"); // 12 minggu lalu

    // Agregasi berdasarkan minggu
    const stats = await Task.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start.toDate(),
            $lte: now.toDate(),
          },
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
      {
        $sort: { "_id.year": 1, "_id.week": 1 },
      },
    ]);

    // Normalisasi data agar minggu yang kosong tetap muncul dengan total = 0
    const result = [];
    for (let i = 0; i < 12; i++) {
      const weekStart = moment()
        .subtract(11 - i, "weeks")
        .startOf("isoWeek");
      const weekKey = {
        year: weekStart.isoWeekYear(),
        week: weekStart.isoWeek(),
      };

      const label = `${weekStart.format("DD MMM")} - ${weekStart
        .clone()
        .endOf("isoWeek")
        .format("DD MMM")}`;

      const found = stats.find(
        (s) => s._id.year === weekKey.year && s._id.week === weekKey.week
      );

      result.push({
        label,
        total: found ? found.total : 0,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Gagal mengambil data grafik mingguan:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data grafik mingguan.",
      error: error.message,
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
  getAllTask,
  getTaskById,
  getAllUserPerformance,
  getWeeklyTaskStats,
};
