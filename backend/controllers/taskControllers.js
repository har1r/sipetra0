const mongoose = require("mongoose");
const Task = require("../models/Task");

const STAGE_ORDER = [
  "diinput",
  "ditata",
  "diteliti",
  "diarsipkan",
  "dikirim",
  "diperiksa",
  "selesai",
];

const ROLE_STAGE_MAP = {
  diinput: "penginput",
  ditata: "penata",
  diteliti: "peneliti",
  diarsipkan: "pengarsip",
  dikirim: "pengirim",
  diperiksa: "pemeriksa",
  selesai: "admin",
};

// Ini menghindari kesalahan ketik jika kamu punya banyak stage
const stageMap = Object.fromEntries(
  Object.entries(ROLE_STAGE_MAP).map(([stage, role]) => [role, stage]),
);

/**
 * Helper: Validasi kelengkapan field objek
 */
const validateFields = (data, requiredFields) => {
  return requiredFields.filter((field) => {
    const value = data[field];

    // 1. Jika nilainya angka 0, anggap VALID (jangan difilter)
    if (typeof value === "number" && value === 0) {
      return false;
    }
    // 2. Cek apakah nilainya "kosong" secara harfiah
    return value === undefined || value === null || String(value).trim() === "";
  });
};

/**
 * Controller: Membuat task baru
 */
const createTask = async (req, res) => {
  try {
    // 1. Ambil data (gunakan let untuk mainData agar bisa dimodifikasi)
    const { title, additionalData, globalNote } = req.body;
    let mainData = { ...req.body.mainData };
    const userId = req.user._id;

    // 2. Validasi Input Dasar
    if (!title || !mainData || !additionalData?.length) {
      return res
        .status(400)
        .json({ message: "Data utama dan pecahan wajib diisi." });
    }

    // 3. LOGIKA OTOMATIS NOPEL UNTUK PENGAKTIFAN
    const isPengaktifan = title.toLowerCase().includes("pengaktifan");

    // Jika pengaktifan dan nopel kosong, buatkan otomatis
    if (isPengaktifan && (!mainData.nopel || mainData.nopel.trim() === "")) {
      const datePart = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const randomPart = Math.random().toString(36).substring(7).toUpperCase();
      mainData.nopel = `ACT-${datePart}-${randomPart}`;
    }

    // 4. Validasi Field Main Data (Sekarang nopel sudah terisi jika pengaktifan)
    const requiredMainFields = [
      "nopel",
      "nop",
      "oldName",
      "address",
      "village",
      "subdistrict",
      "oldlandWide",
      "oldbuildingWide",
    ];

    const missingMainFields = validateFields(mainData, requiredMainFields);

    if (missingMainFields.length > 0) {
      return res.status(400).json({
        message: `Data Utama tidak lengkap: ${missingMainFields.join(", ")}`,
      });
    }

    // 5. Sanitasi & Validasi Additional Data
    const sanitizedAdditionalData = additionalData.map((item, index) => {
      const requiredItemFields = [
        "newName",
        "landWide",
        "buildingWide",
        "certificate",
      ];
      const missingItemFields = validateFields(item, requiredItemFields);

      if (missingItemFields.length > 0) {
        throw new Error(`Data pada pecahan ke-${index + 1} belum lengkap.`);
      }

      return {
        ...item,
        addStatus: "in_progress",
        note: item.note || "",
      };
    });

    // 6. Cek Duplikasi NOPEL
    const existingTask = await Task.findOne({
      "mainData.nopel": mainData.nopel,
    })
      .select("_id")
      .lean();
    if (existingTask) {
      return res
        .status(400)
        .json({ message: `Nopel ${mainData.nopel} sudah terdaftar.` });
    }

    // 7. Logika Otomasi Stage
    const now = new Date();
    const approvals = STAGE_ORDER.map((stageName, index) => {
      const isAutoApprove = isPengaktifan
        ? stageName !== "diarsipkan"
        : stageName === "diinput";

      return {
        stageOrder: index + 1,
        stage: stageName,
        approverId: isAutoApprove ? userId : null,
        approvedAt: isAutoApprove ? now : null,
        status: isAutoApprove ? "approved" : "in_progress",
        note: isAutoApprove
          ? `Otomatis (${isPengaktifan ? "Pengaktifan" : "Sistem"})`
          : "",
      };
    });

    const currentStage = isPengaktifan ? "diarsipkan" : "ditata";

    // 8. Simpan Task
    const newTask = new Task({
      title,
      mainData,
      additionalData: sanitizedAdditionalData,
      globalNote: globalNote || "",
      createdBy: userId,
      currentStage,
      approvals,
    });

    await newTask.save();

    // 9. Response
    return res.status(201).json({
      message: isPengaktifan
        ? `Berkas Pengaktifan berhasil dibuat (NOPEL: ${mainData.nopel})`
        : "Berkas berhasil dibuat dan diteruskan ke tahap selanjutnya.",
      taskId: newTask._id,
      nopel: mainData.nopel,
      nextStage: currentStage,
    });
  } catch (error) {
    return res.status(error.message.includes("lengkap") ? 400 : 500).json({
      message: error.message || "Gagal membuat berkas.",
    });
  }
};

/**
 * - Controller: mengupdate status approval task (approve/reject)
 */
const updateTaskApproval = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { action, note, itemUpdates, isPartialUpdate } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. Cari Task
    const task = await Task.findById(taskId);
    if (!task)
      return res.status(404).json({ message: "Berkas tidak ditemukan." });

    // 2. Proteksi Status Terminal
    const terminalStatuses = ["approved", "rejected"];
    if (terminalStatuses.includes(task.overallStatus)) {
      return res.status(400).json({
        message: `Berkas sudah berstatus ${task.overallStatus.toUpperCase()} (Final).`,
      });
    }

    // 3. Validasi Otoritas Role
    const currentStage = task.currentStage;
    const requiredRole = ROLE_STAGE_MAP[currentStage];
    if (userRole !== "admin" && userRole !== requiredRole) {
      return res.status(403).json({
        message: `Akses ditolak. Tahap '${currentStage}' memerlukan hak akses ${requiredRole}.`,
      });
    }

    // --- 4. LOGIKA AUTO-SAVE (INTI PERBAIKAN) ---
    // Kita proses update item terlebih dahulu
    if (Array.isArray(itemUpdates) && itemUpdates.length > 0) {
      itemUpdates.forEach((upd) => {
        const item = task.additionalData.id(upd.itemId);
        if (item) {
          item.addStatus = upd.status; // "approved" atau "in_progress"
          if (upd.note !== undefined) item.note = upd.note;
        }
      });
      task.markModified("additionalData");

      // JIKA isPartialUpdate TRUE, LANGSUNG SIMPAN DAN KELUAR.
      // Jangan biarkan masuk ke logika switch(action) di bawah.
      if (isPartialUpdate) {
        await task.save();
        return res.status(200).json({
          message: "Item berhasil disimpan secara otomatis.",
          taskId: task._id,
        });
      }
    }

    // 5. Cari Record Approval aktif (Hanya jika bukan partial update)
    const approvalRecord = task.approvals.find((a) => a.stage === currentStage);
    if (!approvalRecord) {
      return res.status(500).json({ message: "Data workflow tidak sinkron." });
    }

    const now = new Date();

    // --- 6. LOGIKA AKSI FINAL (Hanya jalan jika isPartialUpdate FALSE) ---
    switch (action) {
      case "revised":
        task.revisedHistory = {
          revisedAct: currentStage,
          revisedBy: userId,
          revisedNote: note || "Perbaikan data diperlukan.",
          revisedAt: now,
          isResolved: false,
        };
        approvalRecord.status = "revised";
        approvalRecord.note = note;
        approvalRecord.approverId = userId;
        approvalRecord.approvedAt = now;
        break;

      case "rejected":
        approvalRecord.status = "rejected";
        approvalRecord.note = note || "Ditolak permanen.";
        approvalRecord.approverId = userId;
        approvalRecord.approvedAt = now;
        break;

      case "approved":
        // Validasi Tahap Diarsipkan (Cek Report)
        if (currentStage === "diarsipkan") {
          const batchReport = await mongoose
            .model("Report")
            .findOne({
              tasks: taskId,
              status: "FINAL",
            })
            .lean();

          if (!batchReport) {
            return res.status(400).json({
              message:
                "Akses Ditolak: Berkas belum memiliki nomor Surat Pengantar.",
            });
          }
        }

        // Validasi Tahap Diperiksa (Cek kelengkapan Checklist)
        if (currentStage === "diperiksa") {
          const isAllItemsApproved = task.additionalData.every(
            (i) => i.addStatus === "approved",
          );
          if (!isAllItemsApproved) {
            return res.status(400).json({
              message:
                "Semua item pecahan wajib 'Approved' sebelum lanjut stage.",
            });
          }
        }

        approvalRecord.status = "approved";
        approvalRecord.note = note || "Disetujui.";
        approvalRecord.approverId = userId;
        approvalRecord.approvedAt = now;

        if (task.revisedHistory && !task.revisedHistory.isResolved) {
          task.revisedHistory.isResolved = true;
          task.revisedHistory.resolvedAt = now;
        }

        // Transisi Tahapan
        const currentIdx = STAGE_ORDER.indexOf(currentStage);
        const nextStage = STAGE_ORDER[currentIdx + 1];

        if (nextStage) {
          task.currentStage = nextStage;
          if (nextStage === "selesai") {
            const finalRec = task.approvals.find((a) => a.stage === "selesai");
            if (finalRec) {
              finalRec.status = "approved";
              finalRec.approvedAt = now;
              finalRec.approverId = userId;
              finalRec.note = "Otomatis Selesai";
            }
          }
        }
        break;

      default:
        return res.status(400).json({ message: "Aksi tidak valid." });
    }

    await task.save();

    const responseMessages = {
      approved: "Berkas berhasil disetujui.",
      rejected: "Berkas telah ditolak.",
      revised: "Berkas dikembalikan untuk revisi.",
    };

    return res.status(200).json({
      message: responseMessages[action],
      currentStage: task.currentStage,
      taskId: task._id,
    });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan sistem.", error: error.message });
  }
};

/**
 * @controller Update Task
 * Logic: Melakukan pembaruan data dan mereset status jika dalam kondisi revisi.
 */
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, additionalData, globalNote } = req.body;
    let mainData = { ...req.body.mainData };
    const { _id: userId, role } = req.user;

    // 1. Cari Task
    const task = await Task.findById(taskId);
    if (!task)
      return res.status(404).json({ message: "Berkas tidak ditemukan." });

    // 2. Otorisasi (Hanya Admin atau Penginput pada kondisi tertentu)
    const isAdmin = role === "admin";
    const isOwner = task.createdBy.toString() === userId.toString();
    const isEditableStage =
      task.currentStage === "diinput" || task.overallStatus === "revised";

    if (!isAdmin && !(isOwner && isEditableStage)) {
      return res.status(403).json({
        message:
          "Akses ditolak. Berkas sedang diproses atau Anda tidak memiliki akses.",
      });
    }

    // 3. Logika Otomatis NOPEL (Identik dengan Create)
    const isPengaktifan = title?.toLowerCase().includes("pengaktifan");

    if (isPengaktifan && (!mainData.nopel || mainData.nopel.trim() === "")) {
      const datePart = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const randomPart = Math.random().toString(36).substring(7).toUpperCase();
      mainData.nopel = `ACT-${datePart}-${randomPart}`;
    }

    // 4. Validasi Strict (Menghindari 0 dianggap kosong)
    const isInvalid = (val) =>
      val === undefined || val === null || val.toString().trim() === "";

    const requiredMainFields = [
      "nopel",
      "nop",
      "oldName",
      "address",
      "village",
      "subdistrict",
      "oldlandWide",
      "oldbuildingWide",
    ];
    const missingMainFields = requiredMainFields.filter((f) =>
      isInvalid(mainData[f]),
    );

    if (!title || !additionalData?.length || missingMainFields.length > 0) {
      return res.status(400).json({
        message: `Data tidak lengkap. Field kosong: ${missingMainFields.join(", ")}`,
      });
    }

    // 5. Cek Duplikasi NOPEL (Jika NOPEL berubah)
    if (mainData.nopel !== task.mainData.nopel) {
      const duplicate = await Task.exists({
        "mainData.nopel": mainData.nopel,
        _id: { $ne: taskId },
      });
      if (duplicate)
        return res
          .status(400)
          .json({ message: `Nopel ${mainData.nopel} sudah terdaftar.` });
    }

    // 6. Sanitasi Additional Data
    const sanitizedAdditionalData = additionalData.map((item, index) => {
      const requiredItemFields = [
        "newName",
        "landWide",
        "buildingWide",
        "certificate",
      ];
      const missingItems = requiredItemFields.filter((f) => isInvalid(item[f]));

      if (missingItems.length > 0) {
        throw new Error(
          `Data pecahan ke-${index + 1} belum lengkap (${missingItems.join(", ")}).`,
        );
      }
      return {
        ...item,
        addStatus: item.addStatus || "in_progress",
        note: item.note || "",
      };
    });

    // 7. Sinkronisasi Logika Stage & Approvals
    const now = new Date();

    if (isPengaktifan) {
      // PERILAKU PENGAKTIFAN: Paksa ke arsip dan auto-approve semua stage sebelumnya
      task.currentStage = "diarsipkan";
      task.approvals = STAGE_ORDER.map((stageName, index) => {
        const isAutoApprove = stageName !== "diarsipkan";
        return {
          stageOrder: index + 1,
          stage: stageName,
          approverId: isAutoApprove ? userId : null,
          approvedAt: isAutoApprove ? now : null,
          status: isAutoApprove ? "approved" : "in_progress",
          note: isAutoApprove ? "Otomatis (Update ke Pengaktifan)" : "",
        };
      });
    } else {
      // PERILAKU NORMAL: Jika sebelumnya revisi, kembalikan ke in_progress
      if (task.overallStatus === "revised") {
        task.overallStatus = "in_progress";

        // Reset status pada approval stage saat ini agar bisa diperiksa lagi
        const currentApp = task.approvals.find(
          (a) => a.stage === task.currentStage,
        );
        if (currentApp) {
          currentApp.status = "in_progress";
          currentApp.note = "Perbaikan dikirim ulang oleh penginput.";
        }
      }
    }

    // 8. Final Save
    task.title = title;
    task.mainData = mainData;
    task.additionalData = sanitizedAdditionalData;
    task.globalNote = globalNote ?? task.globalNote;

    await task.save();

    return res.status(200).json({
      message: "Berkas berhasil diperbarui.",
      data: {
        taskId: task._id,
        nopel: task.mainData.nopel,
        currentStage: task.currentStage,
        status: task.overallStatus,
      },
    });
  } catch (error) {
    const statusCode = error.message.includes("lengkap") ? 400 : 500;
    return res
      .status(statusCode)
      .json({ message: error.message || "Gagal memperbarui berkas." });
  }
};

/**
 * @controller Delete Task
 * Logic: Penghapusan permanen hanya oleh Admin.
 */
const deleteTask = async (req, res) => {
  try {
    // 1. Otorisasi Ketat
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Otoritas ditolak. Hanya Admin yang dapat memusnahkan berkas.",
      });
    }

    // 2. Eksekusi
    const deletedTask = await Task.findByIdAndDelete(req.params.taskId);
    if (!deletedTask)
      return res.status(404).json({ message: "Berkas tidak ditemukan." });

    return res.status(200).json({
      message: "Berkas berhasil dihapus secara permanen.",
      nopel: deletedTask.mainData?.nopel,
    });
  } catch (error) {
    const isCastError = error.name === "CastError";
    return res.status(isCastError ? 400 : 500).json({
      message: isCastError
        ? "Format ID tidak valid."
        : "Gagal menghapus berkas.",
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
      Math.max(1, Number(req.query.limit) || 5),
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
        "DD MMM",
      )}`;

      const foundWeek = weeklyAggregation.find(
        (w) =>
          w._id.year === startOfWeek.isoWeekYear() &&
          w._id.week === startOfWeek.isoWeek(),
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
      Math.max(1, Number(req.query.limit) || 5),
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

/**
 * - Controller: Mendapatkan semua task dengan filter, pagination, dan akses kontrol
 */
const getAllTasks = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ message: "Sesi berakhir, silakan login kembali." });

    const role = String(user.role || "").toLowerCase();
    const isAdmin = role === "admin";

    // 1. Destructuring Query Parameters
    const {
      nopel,
      currentStage,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // 2. Logika Filtering
    // Filter Nopel (Exact atau Partial sesuai kebutuhan)
    if (nopel) {
      query["mainData.nopel"] = { $regex: String(nopel).trim(), $options: "i" };
    }

    // Filter Berdasarkan Pencarian Teks (Memanfaatkan Text Index yang sudah dibuat)
    if (search) {
      query.$text = { $search: search };
    }

    // Filter Tahapan
    if (currentStage) {
      query.currentStage = currentStage;
    }

    // Filter Status (Diselaraskan dengan enum di Model)
    if (status) {
      const s = status.toLowerCase();
      const statusMap = {
        ditolak: "rejected",
        revisi: "revised",
        selesai: "approved",
        proses: "in_progress",
      };

      if (statusMap[s]) {
        query.overallStatus = statusMap[s];
        // Tambahan: Jika mencari 'selesai', pastikan stage memang di 'selesai'
        if (s === "selesai") query.currentStage = "selesai";
      }
    }

    // Filter Rentang Tanggal
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // 3. Pagination & Execution
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // Menjalankan query secara paralel untuk kecepatan
    const [tasks, totalCount] = await Promise.all([
      Task.find(query)
        .sort({ createdAt: -1 }) // Memanfaatkan index { createdAt: -1 }
        .skip(skip)
        .limit(limitNum)
        .populate("createdBy", "name username") // Ambil info pembuat
        .lean({ virtuals: true }), // lean untuk performa, virtuals untuk id
      Task.countDocuments(query),
    ]);

    // 4. Mapping & Metadata Akses
    const formattedTasks = tasks.map((task) => {
      // Label Status untuk UI
      const statusLabels = {
        rejected: "DITOLAK",
        approved: "SELESAI",
        revised: "REVISI",
        in_progress: "PROSES",
      };

      // Cek hak akses tombol aksi (Edit/Approve)
      // Gunakan ROLE_STAGE_MAP yang sudah didefinisikan secara global
      const requiredRoleForCurrentStage = ROLE_STAGE_MAP[task.currentStage];
      const hasRoleAccess = isAdmin || role === requiredRoleForCurrentStage;

      // Berkas Terminal (Rejected/Approved) tidak bisa diedit/di-approve lagi
      const isTerminal = ["approved", "rejected"].includes(task.overallStatus);
      const isAccessible = hasRoleAccess && !isTerminal;

      return {
        ...task, // Mengembalikan SEMUA field sesuai model (sudah di-lean)
        uiHelpers: {
          displayStatus: statusLabels[task.overallStatus] || "PROSES",
          isAccessible,
          canEdit: isAccessible,
          badgeColor:
            task.overallStatus === "rejected"
              ? "red"
              : task.overallStatus === "revised"
                ? "orange"
                : task.overallStatus === "approved"
                  ? "green"
                  : "blue",
        },
      };
    });

    // 5. Response
    return res.status(200).json({
      success: true,
      pagination: {
        totalData: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
      tasks: formattedTasks,
    });
  } catch (error) {
    console.error("Error at getAllTasks:", error);
    return res.status(500).json({
      message: "Gagal mengambil data berkas.",
      error: error.message,
    });
  }
};

/**
 * - Controller: Mendapatkan detail lengkap task berdasarkan ID
 */
const getTaskById = async (req, res) => {
  try {
    // DISELARASKAN: Menggunakan taskId sesuai dengan router.route("/:taskId")
    const { taskId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Sesi berakhir, silakan login kembali.",
      });
    }

    // DISELARASKAN: Validasi menggunakan taskId
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "ID berkas tidak valid.",
      });
    }

    // DISELARASKAN: Mencari berdasarkan taskId
    const task = await Task.findById(taskId)
      .select("-__v")
      .populate("createdBy", "name username role email")
      .populate("approvals.approverId", "name username role")
      .populate("revisedHistory.revisedBy", "name username role")
      .lean({ virtuals: true });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Berkas tidak ditemukan.",
      });
    }

    const role = String(user.role || "").toLowerCase();
    const isAdmin = role === "admin";

    const statusLabels = {
      rejected: "DITOLAK",
      approved: "SELESAI",
      revised: "REVISI",
      in_progress: "PROSES",
    };

    const requiredRoleForCurrentStage =
      typeof ROLE_STAGE_MAP !== "undefined"
        ? ROLE_STAGE_MAP[task.currentStage]
        : null;
    const hasRoleAccess = isAdmin || role === requiredRoleForCurrentStage;
    const isTerminal = ["approved", "rejected"].includes(task.overallStatus);

    const uiHelpers = {
      displayStatus: statusLabels[task.overallStatus] || "PROSES",
      isAccessible: hasRoleAccess && !isTerminal,
      canEdit:
        (isAdmin ||
          (role === "penginput" &&
            (task.currentStage === "diinput" ||
              task.overallStatus === "revised"))) &&
        !isTerminal,
      badgeColor:
        task.overallStatus === "rejected"
          ? "red"
          : task.overallStatus === "revised"
            ? "orange"
            : task.overallStatus === "approved"
              ? "green"
              : "blue",
    };

    // --- PENYELARASAN STRUKTUR ---
    // Membungkus data ke mainData agar Frontend tidak error saat renderDetails.mainData
    const safeTask = {
      ...task,
      title: task.title,
      mainData: {
        nopel: task.mainData?.nopel || "",
        nop: task.mainData?.nop || "",
        oldName: task.mainData?.oldName || "",
        subdistrict: task.mainData?.subdistrict || "",
        village: task.mainData?.village || "",
        address: task.mainData?.address || "",
        // GUNAKAN ?? 0 agar angka 0 tidak hilang
        oldlandWide: task.mainData?.oldlandWide ?? 0,
        oldbuildingWide: task.mainData?.oldbuildingWide ?? 0,
      },
      additionalData: task.additionalData || [],
      approvals: task.approvals || [],
      revisedInfo:
        [...(task.approvals || [])]
          .reverse()
          .find((a) => a.status === "revised") || null,
      rejectedInfo:
        [...(task.approvals || [])]
          .reverse()
          .find((a) => a.status === "rejected") || null,
      uiHelpers,
    };

    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.status(200).json({
      success: true,
      data: safeTask,
    });
  } catch (error) {
    console.error("Error at getTaskById:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil detail berkas.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
        "title approvals.createdAt approvals.updatedAt approvals.approvedAt approvals.stage approvals.status approvals.approverId",
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
  updateTaskApproval,
  updateTask,
  deleteTask,
  getAllTasks,
  getTaskById,
  getAdminDashboardStats,
  getUserDashboardStats,
  getAllUserPerformance,
};
