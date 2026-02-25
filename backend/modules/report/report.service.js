const mongoose = require("mongoose");
const reportRepository = require("./report.repository");
const Task = require("../../models/Task");
const Report = require("../../models/Report");
const { buildReportPDF } = require("./report.pdf");
const { buildPartialMutationPDF } = require("./report.pdf");

exports.createReport = async ({ user, selectedTaskIds }) => {
  if (!user) {
    throw { status: 401, message: "Silahkan login" };
  }

  if (!["admin", "peneliti"].includes(user.role)) {
    throw { status: 403, message: "Izin akses ditolak" };
  }

  if (!Array.isArray(selectedTaskIds) || selectedTaskIds.length === 0) {
    throw { status: 400, message: "Pilih minimal satu permohonan." };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const selectedTasks = await reportRepository.findTasksByIds(
      selectedTaskIds,
      session,
    );

    if (selectedTasks.length !== selectedTaskIds.length) {
      throw { status: 404, message: "Beberapa permohonan tidak ditemukan." };
    }

    // Validasi jenis pelayanan
    const titles = new Set(selectedTasks.map((task) => task.title));
    if (titles.size > 1) {
      throw {
        status: 400,
        message: "Jenis pelayanan harus sama.",
      };
    }

    // Filter task dengan report aktif
    const tasksWithActiveReport = selectedTasks.filter(
      (task) => task.reportId && task.reportId.status !== "VOID",
    );

    // Cegah pencampuran
    if (
      tasksWithActiveReport.length > 0 &&
      tasksWithActiveReport.length < selectedTasks.length
    ) {
      throw {
        status: 400,
        message:
          "Tidak boleh mencampur permohonan baru dengan yang sudah memiliki laporan aktif.",
      };
    }

    if (tasksWithActiveReport.length === selectedTasks.length) {
      const uniqueReports = new Set(
        tasksWithActiveReport.map((t) => t.reportId._id.toString()),
      );

      if (uniqueReports.size > 1) {
        throw {
          status: 400,
          message: "Tugas berasal dari beberapa laporan aktif berbeda.",
        };
      }

      await session.abortTransaction();

      return {
        message: "Menggunakan nomor pengantar yang sudah ada.",
        data: { batchId: tasksWithActiveReport[0].reportId.batchId },
      };
    }

    // Buat report baru
    const newReport = await reportRepository.createReport(
      selectedTaskIds,
      user._id,
      session,
    );

    await reportRepository.attachTasksToReport(
      selectedTaskIds,
      newReport._id,
      session,
    );

    await session.commitTransaction();

    return {
      message: "Nomor surat pengantar berhasil dibuat.",
      data: { batchId: newReport.batchId },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

exports.generateReport = async ({ user, reportId }) => {
  if (!user) {
    throw { status: 401, message: "Silahkan login." };
  }

  if (!["admin", "peneliti"].includes(user.role)) {
    throw {
      status: 403,
      message: "Anda tidak memiliki izin untuk mengakses fitur ini.",
    };
  }

  const report = await reportRepository.findReportWithTasks(reportId);

  if (!report) {
    throw { status: 404, message: "Laporan tidak ditemukan." };
  }

  if (report.status === "VOID") {
    throw { status: 400, message: "Laporan sudah dibatalkan." };
  }

  return buildReportPDF(report);
};

exports.generatePartialMutation = async ({ taskId }) => {
  const task = await Task.findById(taskId).lean();

  if (!task) {
    const err = new Error("Data tidak ditemukan");
    err.status = 404;
    throw err;
  }

  return buildPartialMutationPDF(task);
};

exports.getVerifiedTasks = async (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;

  const { nopel, startDate, endDate, sortOrder = "desc" } = query;

  const filters = {
    currentStage: {
      $in: ["diarsipkan", "dikirim", "diperiksa", "selesai"],
    },
  };

  if (nopel) {
    filters["mainData.nopel"] = {
      $regex: nopel.trim(),
      $options: "i",
    };
  }

  if (startDate || endDate) {
    filters.updatedAt = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filters.updatedAt.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filters.updatedAt.$lte = end;
    }

    if (!Object.keys(filters.updatedAt).length) {
      delete filters.updatedAt;
    }
  }

  const sortingDirection = sortOrder === "asc" ? 1 : -1;

  const [totalData, tasks] = await Promise.all([
    Task.countDocuments(filters),
    Task.find(filters)
      .sort({ updatedAt: sortingDirection })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "reportId",
        select: "batchId",
      })
      .select(
        "_id title mainData attachments updatedAt additionalData reportId",
      )
      .lean(),
  ]);

  const totalPages = Math.ceil(totalData / limit);

  return {
    pagination: {
      totalData,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      activeSort: sortOrder === "asc" ? "terlama" : "terbaru",
    },
    tasks: tasks.map((task) => {
      const { reportId, ...taskData } = task;

      return {
        ...taskData,
        reportId: reportId?._id || null,
        displayBatchId: reportId?.batchId || "Belum Ada Batch",
      };
    }),
  };
};

exports.addAttachmentToTask = async ({ user, taskId, fileName, driveLink }) => {
  if (!user) {
    const err = new Error("Silahkan login.");
    err.status = 401;
    throw err;
  }

  if (!["admin", "pengarsip"].includes(user.role)) {
    const err = new Error(
      "Anda tidak memiliki izin untuk mengakses fitur ini.",
    );
    err.status = 403;
    throw err;
  }

  if (!fileName?.trim() || !driveLink?.trim()) {
    const err = new Error("Nama file dan Link Drive wajib diisi");
    err.status = 400;
    throw err;
  }

  if (!driveLink.includes("drive.google.com")) {
    const err = new Error(
      "Link yang dimasukkan harus berupa link Google Drive yang valid",
    );
    err.status = 400;
    throw err;
  }

  const task = await Task.findByIdAndUpdate(
    taskId,
    {
      $push: {
        attachments: {
          fileName: fileName.trim(),
          driveLink: driveLink.trim(),
          uploadedBy: user.id,
          uploadedAt: new Date(),
        },
      },
    },
    {
      new: true,
      runValidators: true,
      select: "attachments",
    },
  ).lean();

  if (!task) {
    const err = new Error("Task tidak ditemukan");
    err.status = 404;
    throw err;
  }

  return {
    message: "Lampiran berhasil ditambahkan",
    attachments: task.attachments,
  };
};

exports.getReports = async (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;

  const { batchId, status, startDate, endDate, sortOrder = "desc" } = query;

  const filters = {};

  if (batchId) {
    const safeBatchId = batchId.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    filters.batchId = { $regex: safeBatchId, $options: "i" };
  }

  if (status) {
    filters.status = status.toUpperCase();
  }

  if (startDate || endDate) {
    filters.createdAt = {};

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filters.createdAt.$gte = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filters.createdAt.$lte = end;
    }

    if (!Object.keys(filters.createdAt).length) {
      delete filters.createdAt;
    }
  }

  const sortingDirection = sortOrder === "asc" ? 1 : -1;

  const [totalData, reports] = await Promise.all([
    Report.countDocuments(filters),
    Report.find(filters)
      .populate("tasks", "mainData.nopel mainData.nop title additionalData")
      .populate("generatedBy", "name")
      .sort({ createdAt: sortingDirection })
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(totalData / limit);

  const formattedReports = reports.map((report) => {
    const totalAdditionalEntries =
      report.tasks?.reduce((acc, task) => {
        return acc + (task.additionalData?.length || 0);
      }, 0) || 0;

    return {
      _id: report._id,
      batchId: report.batchId,
      tanggalCetak: report.createdAt,
      admin: report.generatedBy?.name || "Sistem",
      totalTasks: totalAdditionalEntries,
      status: report.status,
      driveLink: report.driveLink || "",
      daftarNopel:
        report.tasks
          ?.map((t) => t.mainData?.nopel)
          .filter(Boolean)
          .join(", ") || "-",
      pdfUrl: report.pdfUrl || null,
    };
  });

  return {
    pagination: {
      totalData,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      activeSort: sortOrder === "asc" ? "terlama" : "terbaru",
    },
    reports: formattedReports,
  };
};

exports.addAttachmentToReport = async ({ user, reportId, driveLink }) => {
  if (!user) {
    const err = new Error("Silahkan login.");
    err.status = 401;
    throw err;
  }

  if (!["admin", "pengarsip"].includes(user.role)) {
    const err = new Error(
      "Anda tidak memiliki izin untuk mengakses fitur ini.",
    );
    err.status = 403;
    throw err;
  }

  if (!driveLink?.trim()) {
    const err = new Error("Link Google Drive wajib diisi");
    err.status = 400;
    throw err;
  }

  if (!driveLink.includes("drive.google.com")) {
    const err = new Error(
      "Link yang dimasukkan harus berupa link Google Drive yang valid",
    );
    err.status = 400;
    throw err;
  }

  const report = await Report.findByIdAndUpdate(
    reportId,
    {
      $set: { driveLink: driveLink.trim() },
    },
    {
      new: true,
      runValidators: true,
      select: "batchId driveLink",
    },
  ).lean();

  if (!report) {
    const err = new Error("Laporan tidak ditemukan");
    err.status = 404;
    throw err;
  }

  return {
    message: "Lampiran berhasil ditambahkan",
    data: {
      batchId: report.batchId,
      driveLink: report.driveLink,
    },
  };
};

exports.voidReport = async ({ user, reportId }) => {
  if (!user || !["admin", "peneliti"].includes(user.role)) {
    const err = new Error("Izin akses ditolak.");
    err.status = 403;
    throw err;
  }

  const session = await mongoose.startSession();

  try {
    let resultPayload;

    await session.withTransaction(async () => {
      const report = await Report.findById(reportId).session(session);

      if (!report) {
        const err = new Error("Report tidak ditemukan.");
        err.status = 404;
        throw err;
      }

      if (report.status === "VOID") {
        const err = new Error("Report sudah dalam status VOID.");
        err.status = 400;
        throw err;
      }

      // 1️⃣ Update report status
      report.status = "VOID";
      await report.save({ session });

      // 2️⃣ Bersihkan relasi di task
      await Task.updateMany(
        { reportId: reportId },
        { $set: { reportId: null } },
        { session },
      );

      resultPayload = {
        message:
          "Report berhasil dibatalkan (VOID) dan permohonan telah dilepaskan.",
        batchId: reportId,
      };
    });

    return resultPayload;
  } finally {
    session.endSession();
  }
};
