const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const Task = require("../models/Task");
const { createBatchReport } = require("../services/createBatchReport"); // Gunakan fungsi baru
const path = require("path");
const LOGO_PATH = path.resolve(__dirname, "./assets/logo-kab.png");

const fs = require("fs");

const fmtDateID = (d = new Date()) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);

const exportReport = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (!["admin", "peneliti"].includes(user.role)) {
      return res.status(403).json({
        message: "Anda tidak memiliki izin untuk mengakses fitur ini.",
      });
    }

    const { taskIds } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "Daftar task kosong." });
    }

    const tasks = await Task.find({ _id: { $in: taskIds } });
    if (tasks.length === 0)
      return res.status(404).json({ message: "Task tidak ditemukan." });

    // Validasi hanya 1 jenis title
    const titles = tasks.map((t) => t.title);
    const uniqueTitles = [...new Set(titles)];
    if (uniqueTitles.length > 1) {
      return res.status(400).json({
        message:
          "Hanya task dengan title yang sama yang bisa di-print bersamaan.",
      });
    }

    // 🔹 SEKARANG: Gunakan service baru yang terhubung ke model Report
    // Mengembalikan: { batchId, sequence, totalTasks, reportId }
    const result = await createBatchReport(taskIds, user.id);
    const { batchId: nomorPengantar, sequence: nomor, year } = result.data;

    const tanggal = fmtDateID(new Date());
    const jenisPelayanan = uniqueTitles[0].replace(/_/g, " ");

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=surat_pengantar_${nomor}.pdf`,
    );
    doc.pipe(res);

    // =======================================================
    // PAGE 1 : Surat Rekomendasi
    // =======================================================
    doc.font("Helvetica").fontSize(11);
    doc.text("PEMERINTAH KABUPATEN TANGERANG", { align: "center" });
    doc.text("BADAN PENDAPATAN DAERAH", { align: "center" });
    doc.text("Gedung Pendapatan Daerah Komp. Perkantoran Tigaraksa", {
      align: "center",
    });
    doc.text("Telp. (021) 599 88333 Fax. (021) 599 88333", { align: "center" });
    doc.text(
      "Website: bapendatangerangkab.go.id Email : bapenda@tangerangkab.go.id",
      { align: "center" },
    );

    try {
      const topY = doc.page.margins.top;
      doc.image(LOGO_PATH, doc.page.margins.left - 2, topY - 10, {
        fit: [100, 70],
        align: "left",
        valign: "top",
      });
    } catch (e) {}

    const lineY = doc.y + 5;
    doc
      .moveTo(doc.page.margins.left, lineY)
      .lineTo(doc.page.width - doc.page.margins.right, lineY)
      .lineWidth(2)
      .stroke();
    doc.moveDown(2);

    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startY = doc.y;

    doc.text(`Nomor     : ${nomorPengantar}`, doc.page.margins.left, startY, {
      align: "left",
    });
    doc.text(`Tigaraksa, ${tanggal}`, doc.page.margins.left, startY, {
      width: contentWidth,
      align: "right",
    });
    doc.moveDown(1);

    let totalBerkas = 0;
    tasks.forEach((task) => {
      totalBerkas += task.additionalData?.length || 1;
    });

    doc.text(`Lampiran : ${totalBerkas} Berkas`);
    doc.text(
      `Hal           : Rekomendasi Permohonan ${jenisPelayanan} SPPT Tahun ${new Date().getFullYear()}`,
    );
    doc.moveDown(1);

    doc.text("Yth. Kepala Badan Pendapatan Daerah");
    doc.text(
      "Cq. Kepala Bidang Pendataan, Penilaian, dan Penetapan Pajak Daerah",
    );
    doc.text("di");
    doc.text("Tempat");
    doc.moveDown(1);

    doc.text(
      `Dipermaklumkan dengan hormat, bersama ini kami sampaikan data permohonan ${jenisPelayanan} SPPT PBB Tahun ${new Date().getFullYear()} pada pelayanan tatap muka UPTD Wilayah IV sebagai berikut:`,
      { align: "justify" },
    );
    doc.moveDown(1);

    // ===== Tabel ringkas jumlah berkas =====
    const tableStartX = doc.x;
    let tableY = doc.y;
    const ringkasHeaders = ["NO AGENDA", "JENIS", "JUMLAH", "KETERANGAN"];
    const ringkasValues = [
      String(nomor),
      jenisPelayanan,
      `${totalBerkas} Berkas`,
      "Rincian Berkas Terlampir",
    ];
    const ringkasWidths = [90, 140, 100, 165];
    const rowHeight = 25;

    let x = tableStartX;
    ringkasHeaders.forEach((header, i) => {
      const w = ringkasWidths[i];
      doc.rect(x, tableY, w, rowHeight).stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(header, x + 4, tableY + 8, { width: w - 8, align: "center" });
      x += w;
    });
    tableY += rowHeight;

    x = tableStartX;
    ringkasValues.forEach((val, i) => {
      const w = ringkasWidths[i];
      doc.rect(x, tableY, w, rowHeight).stroke();
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(val, x + 4, tableY + 8, { width: w - 8, align: "center" });
      x += w;
    });

    tableY += rowHeight;
    doc.moveDown(2);

    doc.x = doc.page.margins.left;

    doc.font("Helvetica").fontSize(11);
    doc.text(
      `Sehubungan dengan hal ini, bahwa berkas permohonan ${jenisPelayanan} SPPT PBB tersebut sudah melalui proses penelitian/verifikasi dan diarsipkan sebagaimana mestinya (data terlampir).`,
      {
        align: "justify",
        width: contentWidth, // Pastikan memberikan lebar agar justify bekerja sempurna
      },
    );

    doc.moveDown(1); // Gunakan 1 atau 2 sesuai kebutuhan estetika

    doc.text(
      "Demikian surat rekomendasi ini kami sampaikan, atas perhatiannya diucapkan terimakasih.",
      {
        align: "justify",
        width: contentWidth,
      },
    );
    // -------------------------

    doc.moveDown(2);

    const footerX = doc.page.margins.left + contentWidth / 2 + 40;
    const footerWidth1 = contentWidth / 2;
    doc.moveDown(4);
    doc.font("Helvetica").fontSize(10);
    doc.text("Kepala UPTD", footerX, doc.y, {
      width: footerWidth1,
      align: "center",
    });
    doc.text("Pajak Daerah Wilayah IV", footerX, doc.y, {
      width: footerWidth1,
      align: "center",
    });
    doc.moveDown(5);
    doc.text("ASEP SUANDI, SH., M.Si", footerX, doc.y, {
      width: footerWidth1,
      align: "center",
    });
    doc.text("NIP. 19800630 200801 1 006", footerX, doc.y, {
      width: footerWidth1,
      align: "center",
    });

    // =======================================================
    // PAGE 2 : Tabel Rincian Task (Landscape)
    // =======================================================
    doc.addPage({ size: "A4", layout: "landscape", margin: 10 });
    doc.font("Helvetica").fontSize(10);
    doc.text(`Nomor      : ${nomorPengantar}`);
    doc.text(`Tanggal    : ${tanggal}`);
    doc.moveDown(1);

    let rows = [];
    let index = 1;
    for (const task of tasks) {
      const main = task.mainData || {};
      const adds = task.additionalData?.length > 0 ? task.additionalData : [{}];
      for (const addData of adds) {
        rows.push([
          index++,
          main.nopel || "-",
          main.nop || "-",
          addData.newName || "-",
          main.oldName || "-",
          main.address || "-",
          main.village || "-",
          main.subdistrict || "-",
          jenisPelayanan,
          addData.landWide || "-",
          addData.buildingWide || "-",
          addData.certificate || "-",
        ]);
      }
    }

    const startX2 = doc.x;
    let y = doc.y;
    const colWidths = [25, 55, 100, 75, 75, 135, 65, 65, 70, 40, 40, 80];
    const headers = [
      "NO",
      "NOPEL",
      "NOP",
      "NAMA PEMOHON",
      "NAMA SPPT",
      "ALAMAT OP",
      "DESA",
      "KECAMATAN",
      "JENIS",
      "LT",
      "LB",
      "BUKTI",
    ];

    function drawRow(row, yRow, isHeader = false) {
      let xRow = startX2;
      const heights = row.map(
        (text, i) =>
          doc.heightOfString(String(text), {
            width: colWidths[i] - 4,
            lineBreak: !isHeader,
          }) + 8,
      );
      const rowHeightLocal = isHeader ? 20 : Math.max(...heights);
      row.forEach((text, i) => {
        const width = colWidths[i];
        doc.rect(xRow, yRow, width, rowHeightLocal).stroke();
        doc
          .font(isHeader ? "Helvetica-Bold" : "Helvetica")
          .fontSize(isHeader ? 8 : 7);
        doc.text(String(text), xRow + 2, yRow + 7, {
          width: width - 4,
          align: isHeader ? "center" : "left",
        });
        xRow += width;
      });
      return rowHeightLocal;
    }

    let rowH = drawRow(headers, y, true);
    y += rowH;
    rows.forEach((row) => {
      const neededHeight = drawRow(row, y, false);
      if (y + neededHeight > doc.page.height - 50) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 10 });
        y = doc.y;
        rowH = drawRow(headers, y, true);
        y += rowH;
      }
      y += neededHeight;
    });

    // Footer Page 2
    const footerY = y + 40;
    let x2 = startX2;
    for (let i = 0; i < colWidths.length - 4; i++) x2 += colWidths[i];
    const footerWidth = colWidths.slice(-4).reduce((a, b) => a + b, 0);

    doc.y = footerY;
    doc.font("Helvetica").fontSize(10);
    doc.text("Kepala UPTD", x2, doc.y, { width: footerWidth, align: "center" });
    doc.text("Pajak Daerah Wilayah IV", x2, doc.y, {
      width: footerWidth,
      align: "center",
    });
    doc.moveDown(5);
    doc.text("ASEP SUANDI, SH., M.Si", x2, doc.y, {
      width: footerWidth,
      align: "center",
    });
    doc.text("NIP. 19800630 200801 1 006", x2, doc.y, {
      width: footerWidth,
      align: "center",
    });

    doc.end();
  } catch (error) {
    console.error("Gagal ekspor surat pengantar PDF:", error);
    res.status(500).json({ message: "Gagal ekspor PDF", error: error.message });
  }
};

// @Deskripsi: Menampilkan daftar tugas yang sudah melewati tahap diteliti/verifikasi untuk dibuatkan surat pengantar
const getVerifiedTasksForExport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const { nopel, startDate, endDate, sortOrder = "desc" } = req.query;

    const filters = {
      currentStage: {
        $in: ["diarsipkan", "dikirim", "diperiksa", "selesai"],
      },
    };

    if (nopel) {
      filters["mainData.nopel"] = { $regex: nopel.trim(), $options: "i" };
    }

    if (startDate || endDate) {
      filters.updatedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filters.updatedAt.$gte = start; // Mongoose akan otomatis handle ini sebagai Date
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filters.updatedAt.$lte = end;
      }
    }

    const sortingDirection = sortOrder === "asc" ? 1 : -1;

    const totalData = await Task.countDocuments(filters);
    const totalPages = Math.ceil(totalData / limit);

    const tasks = await Task.find(filters)
      .sort({ updatedAt: sortingDirection }) // Urutkan terbaru
      .skip(skip) // Lewati data halaman sebelumnya
      .limit(limit) // Batasi hanya 10 data
      .populate({
        path: "reportId",
        select: "batchId", // Ambil nomor batch saja
      })
      .select(
        "_id title mainData attachments updatedAt additionalData reportId",
      )
      .lean(); // Gunakan lean untuk performa lebih baik karena hanya baca data

    return res.status(200).json({
      success: true,
      pagination: {
        totalData,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        activeSort: sortOrder === "asc" ? "terlama" : "terbaru",
      },
      tasks: tasks.map((task) => ({
        ...task,
        displayBatchId: task.reportId
          ? task.reportId.batchId
          : "Belum Ada Batch",
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data untuk export.",
    });
  }
};

const addAttachmentToTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { fileName, driveLink } = req.body;

    if (!fileName || !driveLink) {
      return res
        .status(400)
        .json({ message: "Nama file dan Link Drive wajib diisi" });
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        $push: {
          attachments: {
            fileName,
            driveLink,
            uploadedBy: req.user.id, // Diambil dari middleware auth
            uploadedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true },
    );

    if (!task) return res.status(404).json({ message: "Task tidak ditemukan" });

    return res.status(200).json({
      success: true,
      message: "Link Google Drive berhasil ditambahkan",
      attachments: task.attachments,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getBatchReportsHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const {
      batchId,
      status,
      startDate,
      endDate,
      sortOrder = "desc",
    } = req.query;

    let filters = {};

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
    }

    const sortingDirection = sortOrder === "asc" ? 1 : -1;

    const [totalData, reports] = await Promise.all([
      mongoose.model("Report").countDocuments(filters),
      mongoose
        .model("Report")
        .find(filters)
        // TAMBAHKAN additionalData ke dalam populate agar bisa dihitung
        .populate("tasks", "mainData.nopel mainData.nop title additionalData")
        .populate("generatedBy", "name")
        .sort({ createdAt: sortingDirection })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalData / limit);

    const formattedReports = reports.map((report) => ({
      _id: report._id,
      batchId: report.batchId,
      tanggalCetak: report.createdAt,
      admin: report.generatedBy?.name || "Sistem",

      // LOGIKA BARU: Menghitung total entri data tambahan dari seluruh tasks
      totalTasks:
        report.tasks?.reduce((acc, task) => {
          return acc + (task.additionalData?.length || 0);
        }, 0) || 0,

      status: report.status,
      driveLink: report.driveLink || "",
      daftarNopel:
        report.tasks
          ?.map((t) => t.mainData?.nopel)
          .filter(Boolean)
          .join(", ") || "-",
      pdfUrl: report.pdfUrl || null,
    }));

    return res.status(200).json({
      success: true,
      pagination: {
        totalData,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      reports: formattedReports,
    });
  } catch (error) {
    console.error("Error Get Batch Reports:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal memuat data laporan: " + error.message,
    });
  }
};

const addAttachmentToReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { driveLink } = req.body;

    // Validasi input
    if (!driveLink) {
      return res.status(400).json({
        message: "Link Google Drive wajib diisi",
      });
    }

    // Cari dan update driveLink pada Report
    const report = await mongoose.model("Report").findByIdAndUpdate(
      reportId,
      {
        $set: { driveLink: driveLink },
      },
      { new: true, runValidators: true },
    );

    if (!report) {
      return res.status(404).json({ message: "Batch Report tidak ditemukan" });
    }

    return res.status(200).json({
      success: true,
      message: "Link Batch Report berhasil diperbarui",
      data: {
        batchId: report.batchId,
        driveLink: report.driveLink,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  exportReport,
  getVerifiedTasksForExport,
  addAttachmentToTask,
  getBatchReportsHistory,
  addAttachmentToReport,
};
