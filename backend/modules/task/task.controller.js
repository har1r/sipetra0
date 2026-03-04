const service = require("./task.service");

const getAllTasks = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Sesi berakhir, silakan login kembali." });
    }

    // Pisahkan query untuk filter dan pagination
    const { page, limit, ...filters } = req.query;

    const pagination = {
      page: Math.max(1, parseInt(page) || 1),
      limit: Math.max(1, parseInt(limit) || 10),
    };

    const result = await service.getTasksService(filters, pagination, req.user);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error at getAllTasks Controller:", error);
    return res.status(500).json({
      message: "Gagal mengambil data berkas.",
      error: error.message,
    });
  }
};

module.exports = { getAllTasks };
