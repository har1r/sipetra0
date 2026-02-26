const service = require("../report/report.service");

const getVerifiedTasks = async (req, res, next) => {
  try {
    const result = await service.getVerifiedTasksService(req.query);
    console.log(result);
    res.status(200).json({ result });
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error); // Lihat bagian 'message' atau 'reason'
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const getReports = async (req, res, next) => {
  try {
    const result = await service.getAllReportsService(req.query);

    return res.status(200).json(result);
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const createReports = async (req, res, next) => {
  try {
    const { selectedTaskIds } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Silahkan login." });
    if (!["admin", "peneliti"].includes(user.role)) {
      return res.status(403).json({ message: "Izin akses ditolak." });
    }

    const result = await service.processCreateReport(user, selectedTaskIds);

    return res.status(result.alreadyExists ? 200 : 201).json({
      message: result.alreadyExists
        ? "Menggunakan nomor pengantar yang sudah ada."
        : "Nomor surat pengantar berhasil dibuat.",
      data: { batchId: result.reportId },
    });
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

module.exports = {
  getVerifiedTasks,
  getReports,
  createReports,
};
