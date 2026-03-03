const repository = require("./dashboard.repository");

const getTaskSummaryCards = async () => {
  const rawData = await repository.findStatsTitleCard();

  return rawData.map((item) => {
    const summary = {
      title: item.title,
      total: item.total,
      revisi: 0,
      rejected: 0,
      selesai: 0,
      diperiksa: 0,
    };

    item.details.forEach((detail) => {
      if (detail.status === "revised") summary.revisi += detail.count;
      if (detail.status === "rejected") summary.rejected += detail.count;
      if (detail.stage === "selesai") summary.selesai += detail.count;
      if (detail.stage === "diperiksa") summary.diperiksa += detail.count;
    });

    return summary;
  });
};

const getTasksPendingMoreThanTwoWeeks = async () => {
  //   const twoWeeksAgo = new Date();
  //   twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twoWeeksAgo = new Date(2026, 2, 3, 15, 0);

  const tasks = await repository.findDelayedTasks(twoWeeksAgo);

  return tasks.map((task) => ({
    id: task._id,
    nopel: task.mainData.nopel,
    nop: task.mainData.nop,
    name: task.additionalData[0].newName,
    title: task.title,
    currentStage: task.currentStage,
    overallStatus: task.overallStatus,
    createdAt: task.createdAt,
    daysPending: Math.floor(
      (new Date() - task.createdAt) / (1000 * 60 * 60 * 24),
    ),
  }));
};

const subdistrictStatsForBarChart = async () => {
  // 1. Ambil data mentah dari repository
  const rawData = await repository.findSubdistrictForChart();

  // Debugging: Lihat struktur data pertama untuk memastikan nama field
  // console.log("Raw Data Sample:", rawData[0]);

  // 2. Ambil semua jenis layanan unik untuk kolom/legend
  const serviceTypes = [...new Set(rawData.map((item) => item.title))];

  // 3. Proses pengelompokan
  const groupedData = rawData.reduce((acc, curr) => {
    // Pastikan kita mengambil field yang benar.
    // Jika di project Anda pakai 'subdistrict', gunakan itu.
    const key = curr.subdistrict || "Tanpa Nama Kecamatan";
    const serviceTitle = curr.title;
    const serviceCount = curr.count || 0;

    // Jika group kecamatan belum ada, inisialisasi
    if (!acc[key]) {
      acc[key] = { subdistrict: key };
      // Set semua tipe layanan ke 0 agar tidak undefined di chart
      serviceTypes.forEach((type) => {
        acc[key][type] = 0;
      });
    }

    // Masukkan jumlahnya
    if (serviceTitle) {
      acc[key][serviceTitle] = serviceCount;
    }

    return acc;
  }, {});

  return {
    serviceTypes,
    chartData: Object.values(groupedData),
  };
};

// services/taskService.js
const villageStatsForBarChart = async () => {
  const rawData = await repository.findVillageForChart();

  // 1. Ambil list layanan unik untuk Legend
  const serviceTypes = [...new Set(rawData.map((item) => item.title))];

  // 2. Transformasi data agar dikelompokkan per Kelurahan
  const groupedData = rawData.reduce((acc, curr) => {
    // Gunakan pengecekan aman (optional chaining atau fallback)
    const villageName = curr.village || "Tidak Diketahui";
    const serviceTitle = curr.title;
    const serviceCount = curr.count || 0;

    if (!acc[villageName]) {
      acc[villageName] = { village: villageName };

      // Inisialisasi semua layanan dengan 0
      serviceTypes.forEach((type) => {
        acc[villageName][type] = 0;
      });
    }

    // Masukkan jumlahnya jika title tersedia
    if (serviceTitle) {
      acc[villageName][serviceTitle] = serviceCount;
    }

    return acc;
  }, {});

  return {
    serviceTypes,
    chartData: Object.values(groupedData),
  };
};

module.exports = {
  getTaskSummaryCards,
  getTasksPendingMoreThanTwoWeeks,
  subdistrictStatsForBarChart,
  villageStatsForBarChart,
};
