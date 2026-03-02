const service = require("./dashboard.service");

const getCardTasks = async (req, res) => {
  try {
    const cards = await service.getTaskSummaryCards();

    res.status(200).json({
      message: "Berhasil mengambil statistik dashboard",
      data: cards,
    });
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const getDelayedTasks = async (req, res) => {
  try {
    const data = await service.getTasksPendingMoreThanTwoWeeks();

    return res.status(200).json({
      message: "Data task yang belum diperiksa selama lebih dari 2 minggu",
      count: data.length,
      data,
    });
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const getSubdistrictBarChart = async (req, res) => {
  try {
    const data = await service.subdistrictStatsForBarChart();

    res.status(200).json({
      success: true,
      message: "Statistik layanan per kecamatan berhasil diambil",
      data: data
    });
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const getVillageBarChart = async (req, res) => {
  try {
    const data = await service.villageStatsForBarChart();

    res.status(200).json({
      success: true,
      message: "Statistik layanan per desa/kelurahan berhasil diambil",
      data: data
    });
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

module.exports = { getCardTasks, getDelayedTasks, getSubdistrictBarChart, getVillageBarChart };
