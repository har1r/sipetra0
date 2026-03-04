const repository = require("../report/report.repository");
const { formatDateId } = require("../../utils/formatDateId");

// Fungsi untuk getVerifiedTasks
const getVerifiedTasksService = async (queryParams) => {
  const { nopel, startDate, endDate, sortOrder = "desc" } = queryParams;

  const page = Math.max(1, parseInt(queryParams.page)) || 1;
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit))) || 10;
  const skip = (page - 1) * limit;

  const filters = {
    currentStage: { $in: ["diarsipkan", "dikirim", "diperiksa", "selesai"] },
  };

  if (nopel) {
    const safeNopel = nopel.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters["mainData.nopel"] = { $regex: safeNopel, $options: "i" };
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
    if (Object.keys(filters.updatedAt).length === 0) delete filters.updatedAt;
  }

  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const { totalData, tasks } = await repository.findVerifiedTasks({
    filters,
    sortDirection,
    skip,
    limit,
  });

  const totalPages = Math.ceil(totalData / limit);

  const formattedTasks = tasks.map((task) => {
    const { reportId, ...taskData } = task;
    return {
      ...taskData,
      reportId: reportId?._id || null,
      displayBatchId: reportId?.batchId || "Belum dibuat surat pengantar",
    };
  });

  return {
    pagination: {
      totalData,
      totalPages,
      currentPage: page,
      limit,
      HasNextPage: page < totalPages,
      HasPrevPage: page > 1,
      activeSort: sortOrder === "asc" ? "terlama" : "terbaru",
    },
    tasks: formattedTasks,
  };
};
// Fungsi untuk getVerifiedTasks

// Fungsi untuk getReports
const getAllReportsService = async (queryParams) => {
  const {
    batchId,
    status,
    startDate,
    endDate,
    sortOrder = "desc",
  } = queryParams;

  const page = Math.max(1, parseInt(queryParams.page)) || 1;
  const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit))) || 10;
  const skip = (page - 1) * limit;

  const filters = {};

  if (batchId) {
    const safeBatchId = batchId.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters.batchId = { $regex: safeBatchId, $options: "i" };
  }

  if (status) filters.status = status.toUpperCase();

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
    if (Object.keys(filters.updatedAt).length === 0) delete filters.updatedAt;
  }

  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const { totalData, reports } = await repository.findAllReports({
    filters,
    sortDirection,
    skip,
    limit,
  });

  const totalPages = Math.ceil(totalData / limit);

  const formattedReports = reports.map((report) => {
    const totalAdditionalEntries =
      report.tasks?.reduce((acc, task) => {
        return acc + (task.additionalData?.length || 0);
      }, 0) || 0;

    const { tasks, generatedBy, ...reportData } = report;
    return {
      ...reportData,
      generatedByName: generatedBy?.name || "Unknown",
      totalTasks: totalAdditionalEntries,
    };
  });

  return {
    pagination: {
      totalData,
      totalPages,
      currentPage: page,
      limit,
      HasNextPage: page < totalPages,
      HasPrevPage: page > 1,
      activeSort: sortOrder === "asc" ? "terlama" : "terbaru",
    },
    reports: formattedReports,
  };
};
// Fungsi untuk getReports

// Fungsi untuk createReports
const processCreateReport = async (user, selectedTaskIds) => {
  const selectedTasks = await repository.findTasksWithReports(selectedTaskIds);

  if (selectedTasks.length !== selectedTaskIds.length) {
    throw new Error("Beberapa permohonan tidak ditemukan");
  }

  const titles = [...new Set(selectedTasks.map((task) => task.title))];
  if (titles.length > 1) {
    throw new Error("Jenis pelayanan harus sama dalam satu surat pengantar.");
  }

  const tasksWithActiveReport = selectedTasks.filter(
    (task) => task.reportId && task.reportId.status !== "VOID",
  );

  if (
    tasksWithActiveReport.length > 0 &&
    tasksWithActiveReport.length < selectedTasks.length
  ) {
    throw new Error(
      "Beberapa permohonan sudah memiliki surat pengantar yang aktif.",
    );
  }

  if (tasksWithActiveReport.length === selectedTasks.length) {
    const uniqueReports = [
      ...new Set(
        tasksWithActiveReport.map((task) => task.reportId._id.toString()),
      ),
    ];

    if (uniqueReports.length > 1) {
      throw new Error("Tugas berasal dari beberapa laporan aktif berbeda.");
    }
    return { reportId: uniqueReports[0], alreadyExists: true };
  }

  const currentYear = new Date().getFullYear();
  const lastReport = await repository.getLastSequenceInYear(currentYear);
  const nextSequence = lastReport ? lastReport.sequence + 1 : 1;

  const newReport = await repository.createReportDocument({
    tasks: selectedTaskIds,
    generatedBy: user._id,
    status: "FINAL",
    year: currentYear,
    sequence: nextSequence,
  });

  await repository.updateTasksReportReference(selectedTaskIds, newReport._id);

  return { reportId: newReport._id, alreadyExists: false };
};
// Fungsi untuk createReports

// Fungsi untuk generateReport
const preparePdfData = async (reportId) => {
  const report = await repository.getReportForPdf(reportId);
  if (!report) throw new Error("Surat pengantar tidak ditemukan");

  const selectedTasks = report.tasks || [];
  const rawServiceTitle = selectedTasks[0]?.title || "-";
  const fixServiceTitle = rawServiceTitle.replace(/_/g, " ");

  const tableRows = [];
  let totalData = 0;

  selectedTasks.forEach((task) => {
    const adds = task.additionalData?.length > 0 ? task.additionalData : [{}];
    totalData += adds.length;

    adds.forEach((addData) => {
      tableRows.push([
        tableRows.length + 1,
        task.mainData?.nopel || "-",
        task.mainData?.nop || "-",
        addData.newName || "-",
        task.mainData?.oldName || "-",
        task.mainData?.address || "-",
        task.mainData?.village || "-",
        task.mainData?.subdistrict || "-",
        fixServiceTitle,
        addData.landWide || "0",
        addData.buildingWide || "0",
        addData.certificate || "-",
      ]);
    });
  });

  return {
    report,
    fixServiceTitle,
    tableRows,
    totalData,
    formatDate: formatDateId(report.createdAt),
  };
};
// Fungsi untuk generateReport

// Fungsi untuk generatePartialMutations
const preparePartialMutationData = async (taskId) => {
  const task = await repository.findTaskById(taskId);

  if (!task) throw new Error("Data permohonan tidak ditemukan");

  const pieces = task.additionalData || [];

  const totalUsedLand = pieces.reduce((sum, piece) => {
    return sum + (parseFloat(piece.landWide) || 0);
  }, 0);

  const originalLandWide = parseFloat(task.mainData?.oldlandWide) || 0;

  const remainingLand = originalLandWide - totalUsedLand;

  return {
    task,
    pieces,
    remainingLand: remainingLand > 0 ? remainingLand.toString() : "0",
    totalUsedLand,
  };
};
// Fungsi untuk generatePartialMutations

// Funsi untuk addAttachmentToTasks
const addAttachmentTask = async (taskId, body, userId) => {
  const { fileName, driveLink } = body;

  if (!fileName?.trim() || !driveLink?.trim()) {
    throw new Error("Nama file dan Link Drive wajib diisi");
  }

  if (!driveLink.includes("drive.google.com")) {
    throw new Error(
      "Link yang dimasukkan harus berupa link Google Drive yang valid",
    );
  }

  const attachmentData = [
    {
      fileName: fileName.trim(),
      driveLink: driveLink.trim(),
      uploadedBy: userId,
      uploadedAt: new Date(),
    },
  ];

  const updatedTask = await repository.setAttachmentTask(
    taskId,
    attachmentData,
  );

  if (!updatedTask) {
    throw new Error("Permohonan tidak ditemukan");
  }

  return updatedTask.attachment;
};
// Funsi untuk addAttachmentToTasks

const removeAttachmentTask = async (taskId, attachmentId) => {
  if (!taskId || !attachmentId) {
    throw new Error("ID Task dan ID Attachment wajib disertakan");
  }

  const updatedTask = await repository.removeAttachmentFromTask(
    taskId,
    attachmentId,
  );

  if (!updatedTask) {
    throw new Error("Task tidak ditemukan atau gagal diperbarui");
  }

  return updatedTask.attachment;
};

// Fungsi unutk addAttachmentToReport
const addAttachmentReport = async (reportId, body, userId) => {
  const { fileName, driveLink } = body;

  if (!fileName?.trim() || !driveLink?.trim()) {
    throw new Error("Nama file dan Link Drive wajib diisi");
  }

  if (!driveLink.includes("drive.google.com")) {
    throw new Error(
      "Link yang dimasukkan harus berupa link Google Drive yang valid",
    );
  }

  const attachmentData = {
    fileName: fileName.trim(),
    driveLink: driveLink.trim(),
    uploadedBy: userId,
    uploadedAt: new Date(),
  };

  const updatedReport = await repository.setAttachmentReport(
    reportId,
    attachmentData,
  );

  if (!updatedReport) {
    throw new Error("Surat pengantar tidak ditemukan");
  }

  return updatedReport.attachment;
};
// Fungsi unutk addAttachmentToReport

const PrepareVoidReport = async (reportId) => {
  const report = await repository.findReportById(reportId);
  if (!report) {
    throw new Error("Surat pengantar tidak ditemukan");
  }

  if (report.status === "VOID") {
    throw new Error("Surat pengantar sudah berstatus void atau dihapus");
  }

  await repository.updateReportStatus(reportId, "VOID");
  await repository.detachTasksFromReport(reportId);

  return { reportId };
};

module.exports = {
  getVerifiedTasksService,
  getAllReportsService,
  processCreateReport,
  preparePdfData,
  preparePartialMutationData,
  addAttachmentTask,
  removeAttachmentTask,
  addAttachmentReport,
  PrepareVoidReport,
};
