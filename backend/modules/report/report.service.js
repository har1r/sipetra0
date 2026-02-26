const repository = require("../report/report.repository");

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

module.exports = {
  getVerifiedTasksService,
  getAllReportsService,
  processCreateReport,
};
