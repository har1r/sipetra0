const mongoose = require("mongoose");
const Task = require("../models/Task");

const STAGE_ORDER = [
  "diinput", "ditata", "diteliti", "diarsipkan", "dikirim", "diperiksa", "selesai",
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
    return (
      value === undefined ||           
      value === null ||                
      String(value).trim() === ""      
    );
  });
};

/**
 * - Controller: Membuat task baru
 */
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
      return res.status(400).json({ message: "Data utama dan pecahan wajib diisi." });
    }

    // 3. LOGIKA OTOMATIS NOPEL UNTUK PENGAKTIFAN
    const isPengaktifan = title.toLowerCase().includes("pengaktifan");
    
    // Jika pengaktifan dan nopel kosong, buatkan otomatis
    if (isPengaktifan && (!mainData.nopel || mainData.nopel.trim() === "")) {
      const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomPart = Math.random().toString(36).substring(7).toUpperCase();
      mainData.nopel = `ACT-${datePart}-${randomPart}`;
    }

    // 4. Validasi Field Main Data (Sekarang nopel sudah terisi jika pengaktifan)
    const requiredMainFields = [
      "nopel", "nop", "oldName", "address", "village", 
      "subdistrict", "oldlandWide", "oldbuildingWide"
    ];
    
    const missingMainFields = validateFields(mainData, requiredMainFields);
    
    if (missingMainFields.length > 0) {
      return res.status(400).json({ 
        message: `Data Utama tidak lengkap: ${missingMainFields.join(", ")}` 
      });
    }

    // 5. Sanitasi & Validasi Additional Data
    const sanitizedAdditionalData = additionalData.map((item, index) => {
      const requiredItemFields = ["newName", "landWide", "buildingWide", "certificate"];
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
    const existingTask = await Task.findOne({ "mainData.nopel": mainData.nopel }).select("_id").lean();
    if (existingTask) {
      return res.status(400).json({ message: `Nopel ${mainData.nopel} sudah terdaftar.` });
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
        note: isAutoApprove ? `Otomatis (${isPengaktifan ? "Pengaktifan" : "Sistem"})` : "",
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
    const { action, note, itemUpdates } = req.body; // action: "approved", "rejected", atau "revised"
    const user = req.user;

    const task = await Task.findById(taskId);
    if (!task)
      return res.status(404).json({ message: "Berkas tidak ditemukan." });

    // Jangan izinkan perubahan jika sudah Selesai (Final) atau Ditolak (Terminal)
    if (
      task.overallStatus === "approved" ||
      task.overallStatus === "rejected"
    ) {
      return res.status(400).json({
        message: `Berkas sudah berstatus ${task.overallStatus} dan tidak dapat diubah.`,
      });
    }

    const currentStage = task.currentStage;
    const requiredRole = ROLE_STAGE_MAP[currentStage];

    // Cek Role Keamanan
    if (user.role !== "admin" && user.role !== requiredRole) {
      return res.status(403).json({
        message: `Akses ditolak. Tahap ${currentStage} milik ${requiredRole}.`,
      });
    }

    // --- 1. UPDATE ITEM PECAHAN (Jika ada) ---
    if (Array.isArray(itemUpdates) && itemUpdates.length > 0) {
      itemUpdates.forEach((upd) => {
        const item = task.additionalData.id(upd.itemId);
        if (item) {
          item.addStatus = upd.status; // "in_progress" atau "approved"
          if (upd.note) item.note = upd.note;
        }
      });
      task.markModified("additionalData");
    }

    const approvalRecord = task.approvals.find((a) => a.stage === currentStage);

    // --- 2. LOGIKA AKSI: REVISED (Minta Perbaikan) ---
    if (action === "revised") {
      // Simpan ke histori revisi (Tanpa menghapus data sebelumnya)
      task.revisedHistory = {
        revisedAct: currentStage,
        revisedBy: user._id,
        revisedNote: note || "Mohon lakukan perbaikan data.",
        revisedAt: new Date(),
        isResolved: false, // <--- Penanda: Revisi baru masuk, belum selesai
      };

      if (approvalRecord) {
        approvalRecord.status = "revised";
        approvalRecord.note = note;
        approvalRecord.approverId = user._id;
        approvalRecord.approvedAt = new Date();
      }

      // overallStatus akan otomatis diupdate menjadi "revised" oleh middleware pre-save
    }

    // --- 3. LOGIKA AKSI: REJECTED (Tolak Permanen) ---
    else if (action === "rejected") {
      if (approvalRecord) {
        approvalRecord.status = "rejected";
        approvalRecord.note = note || "Ditolak Permanen";
        approvalRecord.approverId = user._id;
        approvalRecord.approvedAt = new Date();
      }
      // Note: revisedHistory TIDAK dihapus di sini sesuai permintaan (untuk bukti audit)
    }

    // --- 4. LOGIKA AKSI: APPROVED (Setuju/Lanjut) ---
    else if (action === "approved") {
      
      // ============================================================
      // LOGIKA KHUSUS TAHAP DIARSIPKAN (PENGECEKAN BATCH ID)
      // ============================================================
      if (currentStage === "diarsipkan") {
        // Cari apakah ID task ini sudah ada di dalam array 'tasks' pada koleksi Report
        const batchReport = await mongoose.model("Report").findOne({ 
          tasks: taskId,
          status: "FINAL" 
        });

        if (!batchReport) {
          return res.status(400).json({
            message: "Akses Ditolak: Berkas ini belum memiliki nomor Surat Pengantar (Batch ID). Silakan lakukan proses 'Generate Batch' terlebih dahulu di menu Cetak Pengantar."
          });
        }
      }
      // ============================================================

      if (task.revisedHistory) {
        task.revisedHistory.isResolved = true; // Penanda: Masalah sudah diperbaiki
      }

      // Validasi khusus tahap diperiksa
      if (currentStage === "diperiksa") {
        const isAllDone = task.additionalData.every(
          (i) => i.addStatus === "approved",
        );
        if (!isAllDone) {
          return res.status(400).json({
            message: "Semua item pecahan harus berstatus 'approved' sebelum menyetujui tahap ini.",
          });
        }
      }

      // Update record tahap saat ini
      if (approvalRecord) {
        approvalRecord.status = "approved";
        approvalRecord.note = note || "Disetujui";
        approvalRecord.approverId = user._id;
        approvalRecord.approvedAt = new Date();
      }

      // Tentukan Tahap Selanjutnya
      const idx = STAGE_ORDER.indexOf(currentStage);
      const nextStage = STAGE_ORDER[idx + 1];

      if (nextStage) {
        task.currentStage = nextStage;

        // Jika tahap berikutnya adalah 'selesai', auto-approve stage selesai tersebut
        if (nextStage === "selesai") {
          const finalRec = task.approvals.find((a) => a.stage === "selesai");
          if (finalRec) {
            finalRec.status = "approved";
            finalRec.approvedAt = new Date();
            finalRec.approverId = user._id;
          }
        }
      }
    }

    // Simpan perubahan (Middleware pre-save akan mengupdate task.overallStatus)
    await task.save();

    let responseMsg = "Berkas berhasil diperbarui.";
    if (action === "approved") responseMsg = "Berkas berhasil disetujui.";
    if (action === "rejected") responseMsg = "Berkas telah ditolak permanen.";
    if (action === "revised") responseMsg = "Berkas dikembalikan untuk revisi.";

    return res.status(200).json({
      message: responseMsg,
      task,
    });
  } catch (err) {
    console.error("Approval Error:", err);
    return res.status(500).json({ message: "Server Error: " + err.message });
  }
};

/**
 * - Controller: Mengupdate data task (hanya untuk admin & penginput dengan kondisi tertentu)
 */
const updateTask = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.params;
    const { title, mainData, additionalData, globalNote } = req.body;

    // 1. Ambil task dan pastikan eksistensinya
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task tidak ditemukan." });
    }

    // 2. Validasi Role & Kondisi (Hanya Admin atau Penginput)
    // Syarat Edit: 
    // - User adalah Admin 
    // - ATAU User adalah Penginput (Harus role 'penginput' DAN task berada di stage 'diinput' ATAU status 'revised')
    const isPenginput = user.role === "penginput";
    const isAdmin = user.role === "admin";
    
    // Non-Admin hanya bisa edit jika stage-nya 'diinput' atau sedang dalam status 'revised' (revisi)
    const canEdit = isAdmin || (isPenginput && (task.currentStage === "diinput" || task.overallStatus === "revised"));

    if (!canEdit) {
      return res.status(403).json({
        message: "Anda tidak memiliki izin untuk mengupdate task ini pada tahap/status sekarang.",
      });
    }

    // 3. Validasi Input Dasar
    if (!title || !mainData || !additionalData?.length) {
      return res.status(400).json({ message: "Data utama dan pecahan wajib diisi." });
    }

    // 4. Validasi Field Main Data (Selaras dengan createTask)
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
    const isMainDataInvalid = requiredMainFields.some((field) => !mainData[field]);

    if (isMainDataInvalid) {
      return res.status(400).json({ message: "Field pada Data Utama belum lengkap." });
    }

    // 5. Proteksi NOPEL (Jika NOPEL diubah, pastikan tidak duplikat dengan berkas lain)
    if (mainData.nopel !== task.mainData.nopel) {
      const duplicateNopel = await Task.findOne({ 
        "mainData.nopel": mainData.nopel, 
        _id: { $ne: taskId } 
      }).select("_id").lean();
      
      if (duplicateNopel) {
        return res.status(400).json({ message: `Nopel ${mainData.nopel} sudah digunakan berkas lain.` });
      }
    }

    // 6. Validasi & Sanitasi Additional Data (Selaras dengan createTask)
    const sanitizedAdditionalData = additionalData.map((item, index) => {
      if (!item.newName || !item.landWide || !item.buildingWide || !item.certificate) {
        throw new Error(`Data pada pecahan ke-${index + 1} belum lengkap.`);
      }
      return {
        ...item,
        addStatus: item.addStatus || "in_progress", // Pertahankan status yang ada atau default
        note: item.note || "",
      };
    });

    // 7. Logika Reset Status Revisi
    // Jika berkas sedang 'revised', lalu penginput mengupdate data, 
    // maka kita kembalikan overallStatus ke 'in_progress' dan tandai revisedHistory selesai
    if (task.overallStatus === "revised") {
      task.overallStatus = "in_progress";
      if (task.revisedHistory && !task.revisedHistory.isResolved) {
        task.revisedHistory.isResolved = true;
        task.revisedHistory.resolvedAt = new Date();
      }
      
      // Update juga status di array approvals untuk stage terkait dari 'revised' kembali ke 'in_progress'
      const currentApproval = task.approvals.find(a => a.stage === task.currentStage);
      if (currentApproval) {
        currentApproval.status = "in_progress";
        currentApproval.note = "Data telah diperbaiki oleh penginput";
      }
    }

    // 8. Eksekusi Update
    task.title = title;
    task.mainData = mainData;
    task.additionalData = sanitizedAdditionalData;
    task.globalNote = globalNote || task.globalNote;

    await task.save();

    return res.status(200).json({
      message: "Berkas berhasil diperbarui.",
      task: {
        _id: task._id,
        currentStage: task.currentStage,
        overallStatus: task.overallStatus
      },
    });

  } catch (error) {
    console.error("Error updating task:", error);
    const statusCode = error.message.includes("lengkap") ? 400 : 500;
    return res.status(statusCode).json({
      message: error.message || "Terjadi kesalahan saat mengupdate task.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * - Controller: Mengupdate data task (hanya untuk admin & penginput dengan kondisi tertentu)
 */
const deleteTask = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.params;

    // 1. Validasi Role (Hanya Admin yang punya otoritas penuh menghapus berkas)
    if (user?.role !== "admin") {
      return res.status(403).json({ 
        message: "Akses ditolak. Hanya Admin yang memiliki izin untuk menghapus berkas." 
      });
    }

    // 2. Cari dan Hapus Berkas
    // Menggunakan findByIdAndDelete agar lebih atomik jika tidak ada logika kompleks di hook
    const deletedTask = await Task.findByIdAndDelete(taskId);

    if (!deletedTask) {
      return res.status(404).json({ message: "Berkas tidak ditemukan." });
    }

    // 3. Response Sukses
    return res.status(200).json({
      message: "Berkas berhasil dihapus secara permanen.",
      taskId: deletedTask._id,
      nopel: deletedTask.mainData?.nopel // Memberikan info nopel yang dihapus untuk audit log user
    });

  } catch (error) {
    console.error("Error deleting task:", error);
    
    // Penanganan CastError (ID tidak valid) yang lebih ringkas
    const statusCode = error.name === "CastError" ? 400 : 500;
    const errorMessage = error.name === "CastError" 
      ? "Format ID berkas tidak valid." 
      : "Gagal menghapus berkas dari server.";

    return res.status(statusCode).json({
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
    if (!user) return res.status(401).json({ message: "Silahkan login dulu" });

    const role = String(user.role || "").toLowerCase();
    const isAdmin = role === "admin";

    const { nopel, currentStage, status, startDate, endDate, page, limit } = req.query;

    const query = {};

    // 1. Filter Nopel (Mencari di dalam object mainData)
    if (nopel) {
      query["mainData.nopel"] = { $regex: String(nopel).trim(), $options: "i" };
    }

    // 2. Filter Tahapan
    if (currentStage) {
      query.currentStage = currentStage;
    }

    // 3. Filter Status (Diselaraskan dengan model & controller baru)
    if (status) {
      const s = status.toUpperCase();
      if (s === "DITOLAK") {
        query.overallStatus = "rejected";
      } else if (s === "REVISI") {
        query.overallStatus = "revised";
      } else if (s === "SELESAI") {
        query.overallStatus = "approved";
        query.currentStage = "selesai";
      } else if (s === "PROSES") {
        query.overallStatus = "in_progress";
      }
    }

    // 4. Filter Range Tanggal
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // 5. Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // 6. Eksekusi Query
    const [tasks, totalCount] = await Promise.all([
      Task.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(query),
    ]);

    // 7. Mapping Data untuk Tampilan UI
    const formattedTasks = tasks.map((task) => {
      let displayStatus = "PROSES"; // Default: in_progress

      // Tentukan label status berdasarkan overallStatus
      if (task.overallStatus === "rejected") {
        displayStatus = "DITOLAK";
      } else if (task.overallStatus === "approved") {
        displayStatus = "SELESAI";
      } else if (task.overallStatus === "revised") {
        displayStatus = "REVISI";
      } else {
        displayStatus = "PROSES";
      }

      // Role Stage Mapping (Sesuaikan dengan sistem ROLE_STAGE_MAP Anda)
      const stageMap = {
        penginput: "diinput",
        penata: "ditata",
        peneliti: "diteliti",
        pemeriksa: "diperiksa",
        pengarsip: "diarsipkan",
        pengirim: "dikirim",
      };

      // Hak akses tombol aksi:
      // - Bukan admin? Cek apakah stage saat ini milik role user.
      // - Admin? Selalu punya akses kecuali sudah 'selesai' atau 'rejected'.
      const hasRoleAccess = isAdmin || stageMap[role] === task.currentStage;
      
      // Berkas 'REJECTED' tidak bisa diapa-apain lagi (Terminal)
      // Berkas 'REVISI' bisa diakses oleh role penginput (untuk edit) atau role pemeriksa terkait.
      const isFinal = task.overallStatus === "approved" || task.overallStatus === "rejected";
      const canEdit = hasRoleAccess && !isFinal;

      return {
        id: task._id,
        nopel: task.mainData?.nopel || "",
        nop: task.mainData?.nop || "",
        oldName: task.mainData?.oldName || "",
        title: task.title,
        additionalData: task.additionalData || [],
        currentStage: task.currentStage,
        status: displayStatus,
        createdAt: task.createdAt,
        isAccessible: canEdit,
        // Kirim data revisi terakhir jika ada, agar UI bisa memunculkan tooltip/notifikasi
        lastRevision: task.revisedHistory ? {
          note: task.revisedHistory.revisedNote,
          stage: task.revisedHistory.revisedAct,
          isResolved: task.revisedHistory.isResolved
        } : null
      };
    });

    return res.status(200).json({
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      tasks: formattedTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * - Controller: Mendapatkan detail lengkap task berdasarkan ID, dengan validasi dan akses kontrol
 */
const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    // 1️⃣ Validasi Dasar
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ message: "ID task tidak valid atau tidak ditemukan." });
    }

    // 2️⃣ Ambil data dengan populate dan hilangkan field internal (__v)
    // Menggunakan lean() agar performa lebih cepat dan data berupa objek JS biasa
    const task = await Task.findById(taskId)
      .select("-__v")
      .populate("createdBy", "name email role")
      .populate("approvals.approverId", "name email role")
      .populate("revisedHistory.revisedBy", "name email role") // Tambahkan populate untuk revisedHistory
      .lean();

    if (!task) {
      return res.status(404).json({ message: "Task tidak ditemukan di database." });
    }

    // 3️⃣ Pastikan default value untuk Array jika data kosong (Safety Guard)
    const safeTask = {
      ...task,
      additionalData: task.additionalData || [],
      approvals: task.approvals || [],
      revisedHistory: task.revisedHistory || null
    };

    // 4️⃣ Deteksi stage yang ditolak (Opsional, untuk mempermudah frontend)
    const rejectedStage = task.approvals.find(a => a.status === "rejected")?.stage || null;
    const revisedStage = task.approvals.find(a => a.status === "revised")?.stage || null;

    // 5️⃣ Header Keamanan
    res.set("Cache-Control", "no-store");

    // 6️⃣ Kirim semua data sekaligus
    // Menambahkan field bantu rejectedStage & revisedStage tanpa menghapus field asli
    return res.status(200).json({
      ...safeTask,
      rejectedStage, 
      revisedStage
    });

  } catch (error) {
    console.error("Error getting task detail:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server saat mengambil detail task.",
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
