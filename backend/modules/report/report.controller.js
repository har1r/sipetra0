const reportService = require("./report.service");

exports.createReport = async (req, res, next) => {
  try {
    const result = await reportService.createReport({
      user: req.user,
      selectedTaskIds: req.body.selectedTaskIds,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const result = await reportService.generateReport({
      user: req.user,
      reportId: req.params.reportId,
    });

    if (!result?.doc) {
      throw new Error("Gagal membuat laporan PDF.");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${result.filename}`,
    );

    result.doc.pipe(res);
    result.doc.end();
  } catch (error) {
    next(error);
  }
};

exports.generatePartialMutation = async (req, res, next) => {
  try {
    const result = await reportService.generatePartialMutation({
      taskId: req.params.taskId,
    });

    if (!result?.doc) {
      throw new Error("Failed to generate PDF document");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${result.filename}`,
    );

    result.doc.on("error", (err) => {
      next(err);
    });

    result.doc.pipe(res);
    result.doc.end();
  } catch (error) {
    next(error);
  }
};

exports.getVerifiedTasks = async (req, res, next) => {
  try {
    const result = await taskService.getVerifiedTasks(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.addAttachmentToTask = async (req, res, next) => {
  try {
    const result = await taskService.addAttachmentToTask({
      user: req.user,
      taskId: req.params.taskId,
      fileName: req.body.fileName,
      driveLink: req.body.driveLink,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const result = await reportService.getReports(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.addAttachmentToReport = async (req, res, next) => {
  try {
    const result = await reportService.addAttachmentToReport({
      user: req.user,
      reportId: req.params.reportId,
      driveLink: req.body.driveLink,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.voidReport = async (req, res, next) => {
  try {
    const result = await reportService.voidReport({
      user: req.user,
      reportId: req.params.reportId,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
