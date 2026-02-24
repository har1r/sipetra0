const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const Task = require("../models/Task");
const Report = require("../models/Report");
const path = require("path");
const LOGO_PATH = path.resolve(__dirname, "./assets/logo-kab.png");

const fmtDateID = (d = new Date()) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);

// @Deskripsi: Membuat no surat pengantar berdasarkan permohonan yang dipilih contoh: 973/001-UPT.PD.WIL.IV/2026
const createReport = async (req, res) => {
  const session = await mongoose.startSession(); // Menggabungkan operasi database mongoDB dalam satu transaksi untuk memastikan konsistensi data
  session.startTransaction(); // Operasi berhasil (commit) maka berhasil semua, jika gagal maka semua operasi dibatalkan (rollback)
  
  try {
    const user = req.user;
    const { selectedTaskIds } = req.body; // selectedTaksIds berisi id dari permohonan yang dipilih untuk dibuatkan surat pengantar

    if (!user)
      return res
        .status(401)
        .json({ message: "Silahkan login." });
    if (!["admin", "peneliti"].includes(user.role))
      return res.status(403).json({
        message: "Izin akses ditolak.",
      });
    if (!Array.isArray(selectedTaskIds) || selectedTaskIds.length === 0)
      return res.status(400).json({
        message:
          "Pilih minimal satu permohonan.",
      });

    const selectedTasks = await Task.find({ _id: { $in: selectedTaskIds } }, { title: 1, reportId: 1 }).session(session);

    if (selectedTasks.length !== selectedTaskIds.length)
      return res
        .status(404)
        .json({ message: "Beberapa permohonan yang dipilih tidak ditemukan." });

    const titles = new Set(selectedTasks.map((task) => task.title));
    if (titles.size > 1) {
      return res.status(400).json({
        message:
          "Jenis pelayanan harus sama.",
      });
    }

    const tasksWithReport = selectedTasks.filter(
      (task) => task.reportId
    );
    const uniqueTasksWithReport = new Set(tasksWithReport.map(task => task.reportId.toString()));
    if (uniqueTasksWithReport.size > 1) {
    return res.status(400).json({ 
    message: "Tugas yang dipilih berasal dari beberapa laporan yang berbeda." 
      });
    }
    if (tasksWithReport.length === selectedTasks.length) {
      await session.abortTransaction(); // Batalkan transaksi karena tidak ada data baru yang dibuat
      return res.status(200).json({
        message: "Menggunakan nomor pengantar yang sudah ada.",
        data: { batchId: tasksWithReport[0].reportId }
      });
    }
    if (tasksWithReport.length > 0) {
      return res.status(400).json({ message: "Tidak boleh mencampur permohonan lama dan baru." });
    }

    const newReport = new Report({
      tasks: selectedTaskIds,
      generatedBy: user._id,
      status: "FINAL",
    });

    await newReport.save({ session });

    await Task.updateMany(
      { _id: { $in: selectedTaskIds } },
      { $set: { reportId: newReport._id } },
      { session }
    );

    await session.commitTransaction(); // Jika semua operasi berhasil, komit transaksi

    return res.status(200).json({
      message: "Nomor surat pengantar berhasil dibuat.",
      data: {
        batchId: newReport._id,
      },
    });
  } catch (error) {
    await session.abortTransaction(); // Batalkan jika terjadi error di tengah jalan
    console.error("Error createReport:", error.message);
    return res.status(500).json({ 
      message: "Gagal membuat nomor pengantar baru.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

// @Deskripsi: Menghasilkan surat pengantar dalam format PDF berdasarkan data permohonan yang dipilih
const generateReport = async (req, res) => {
  try {
    const user = req.user;
    const { reportId } = req.params;

    if (!user)
      return res
        .status(401)
        .json({ message: "Silahkan login." });
    if (!["admin", "peneliti"].includes(user.role)) {
      return res.status(403).json({
        message: "Anda tidak memiliki izin untuk mengakses fitur ini.",
      });
    }

    const report = await Report.findById(reportId).populate("tasks").lean();

    if (!report) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    // 1. Persiapan Data & Variabel Pendukung
    const selectedTasks = report.tasks || [];
    const nomorPengantar = report.batchId;
    const nomor = report.sequence;
    const tanggal = fmtDateID(report.createdAt);
    const rawServiceTitle = selectedTasks[0]?.title || "-";
    const jenisPelayanan = rawServiceTitle.replace(/_/g, " ");
    
    // Konstanta Layout
    const marginLeft = 50;
    const marginRight = 50;
    const contentWidth = 595 - marginLeft - marginRight; // A4 width is 595

    // Pemrosesan Baris Lampiran (Halaman 2) & Hitung Total Berkas
    const rows = [];
    let totalBerkas = 0;
    selectedTasks.forEach((task) => {
      const adds = task.additionalData?.length > 0 ? task.additionalData : [{}];
      totalBerkas += adds.length;
      
      adds.forEach((addData) => {
        rows.push([
          rows.length + 1,
          task.mainData?.nopel || "-",
          task.mainData?.nop || "-",
          addData.newName || "-",
          task.mainData?.oldName || "-",
          task.mainData?.address || "-",
          task.mainData?.village || "-",
          task.mainData?.subdistrict || "-",
          jenisPelayanan,
          addData.landWide || "-",
          addData.buildingWide || "-",
          addData.certificate || "-",
        ]);
      });
    });

    // 2. Inisialisasi PDF
    const doc = new PDFDocument({ size: "A4", margin: marginLeft });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=surat_pengantar_${nomor}.pdf`);
    doc.pipe(res);

    // HELPER: Fungsi Tanda Tangan agar konsisten di semua halaman
    const drawSignature = (d, x, y, width, label) => {
      d.y = y;
      d.x = x;
      d.font("Helvetica").fontSize(10);
      d.text("Kepala UPTD", { width, align: "center" });
      d.text("Pajak Daerah Wilayah IV", { width, align: "center" });
      d.moveDown(4);
      d.font("Helvetica-Bold").text("ASEP SUANDI, SH., M.Si", { width, align: "center" });
      d.font("Helvetica").text("NIP. 19800630 200801 1 006", { width, align: "center" });
    };

    // 3. HEADER PDF (Halaman 1)
    doc.font("Helvetica").fontSize(11);
    doc.text("PEMERINTAH KABUPATEN TANGERANG", { align: "center" });
    doc.text("BADAN PENDAPATAN DAERAH", { align: "center" });
    doc.fontSize(9);
    doc.text("Gedung Pendapatan Daerah Komp. Perkantoran Tigaraksa", { align: "center" });
    doc.text("Telp. (021) 599 88333 Fax. (021) 599 88333", { align: "center" });
    doc.text("Website: bapendatangerangkab.go.id Email : bapenda@tangerangkab.go.id", { align: "center" });

    try {
      doc.image(LOGO_PATH, marginLeft - 2, 40, { fit: [100, 70] });
    } catch (e) {
      console.error("Logo tidak ditemukan:", e.message);
    }

    const lineY = 115;
    doc.moveTo(marginLeft, lineY).lineTo(595 - marginRight, lineY).lineWidth(2).stroke();
    doc.moveDown(3);

    // 4. INFORMASI SURAT
    const topInfoY = doc.y;
    doc.font("Helvetica").fontSize(10);
    doc.text(`Nomor     : ${nomorPengantar}`, marginLeft, topInfoY);
    doc.text(`Tigaraksa, ${tanggal}`, marginLeft, topInfoY, { width: contentWidth, align: "right" });
    
    doc.text(`Lampiran : ${totalBerkas} Berkas`);
    doc.text(`Hal           : Rekomendasi Permohonan ${jenisPelayanan} SPPT Tahun ${report.year}`);
    doc.moveDown(1.5);

    doc.text("Yth. Kepala Badan Pendapatan Daerah");
    doc.text("Cq. Kepala Bidang Pendataan, Penilaian, dan Penetapan Pajak Daerah");
    doc.text("di");
    doc.text("Tempat");
    doc.moveDown(1.5);

    // Paragraf 1
    doc.text(
      `Dipermaklumkan dengan hormat, bersama ini kami sampaikan data permohonan ${jenisPelayanan} SPPT PBB Tahun ${report.year} pada pelayanan tatap muka UPTD Wilayah IV sebagai berikut:`,
      { align: "justify", width: contentWidth }
    );
    doc.moveDown(1);

    // 5. TABEL RINGKASAN
    let tableY = doc.y;
    const ringkasHeaders = ["NO AGENDA", "JENIS", "JUMLAH", "KETERANGAN"];
    const ringkasValues = [String(nomor), jenisPelayanan, `${totalBerkas} Berkas`, "Rincian Berkas Terlampir"];
    const ringkasWidths = [90, 140, 100, 165];
    const rowHeight = 25;

    // Draw Header Tabel
    let currentX = marginLeft;
    ringkasHeaders.forEach((header, i) => {
      doc.rect(currentX, tableY, ringkasWidths[i], rowHeight).stroke();
      doc.font("Helvetica-Bold").fontSize(9).text(header, currentX + 4, tableY + 8, { width: ringkasWidths[i] - 8, align: "center" });
      currentX += ringkasWidths[i];
    });

    // Draw Value Tabel
    tableY += rowHeight;
    currentX = marginLeft;
    ringkasValues.forEach((val, i) => {
      doc.rect(currentX, tableY, ringkasWidths[i], rowHeight).stroke();
      doc.font("Helvetica").fontSize(9).text(val, currentX + 4, tableY + 8, { width: ringkasWidths[i] - 8, align: "center" });
      currentX += ringkasWidths[i];
    });

    // 6. PARAGRAF PENUTUP (Alignment diperbaiki)
    doc.y = tableY + rowHeight + 15;
    doc.x = marginLeft; // Reset X agar sejajar
    doc.font("Helvetica").fontSize(10);
    
    doc.text(
      `Sehubungan dengan hal ini, bahwa berkas permohonan ${jenisPelayanan} SPPT PBB tersebut sudah melalui proses penelitian/verifikasi dan diarsipkan sebagaimana mestinya (data terlampir).`,
      { align: "justify", width: contentWidth }
    );

    doc.moveDown(1);
    doc.text(
      "Demikian surat rekomendasi ini kami sampaikan, atas perhatiannya diucapkan terimakasih.",
      { align: "justify", width: contentWidth }
    );

    // Tanda Tangan Hal 1
    drawSignature(doc, 330, doc.y + 30, 200);

    // 7. LAMPIRAN (Halaman 2 - Landscape)
    doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
    doc.font("Helvetica").fontSize(9);
    doc.text(`Nomor      : ${nomorPengantar}`);
    doc.text(`Tanggal    : ${tanggal}`);
    doc.moveDown(1);

    const colWidths = [25, 55, 100, 80, 80, 130, 65, 65, 70, 35, 35, 70];
    const headers = ["NO", "NOPEL", "NOP", "NAMA PEMOHON", "NAMA SPPT", "ALAMAT OP", "DESA", "KEC", "JENIS", "LT", "LB", "BUKTI"];

    const drawTableRow = (row, yPos, isHeader = false) => {
      let maxHeight = 0;
      
      // Hitung tinggi baris berdasarkan teks terpanjang
      row.forEach((text, i) => {
        const h = doc.heightOfString(String(text), { width: colWidths[i] - 4 }) + 10;
        if (h > maxHeight) maxHeight = h;
      });

      // Proteksi pindah halaman jika tidak cukup ruang
      if (yPos + maxHeight > 550) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
        yPos = 20;
        // Gambar header lagi di halaman baru
        let xHeader = 20;
        headers.forEach((h, i) => {
          doc.rect(xHeader, yPos, colWidths[i], 20).stroke();
          doc.font("Helvetica-Bold").fontSize(8).text(h, xHeader + 2, yPos + 6, { width: colWidths[i] - 4, align: "center" });
          xHeader += colWidths[i];
        });
        yPos += 20;
      }

      let xCell = 20;
      row.forEach((text, i) => {
        doc.rect(xCell, yPos, colWidths[i], maxHeight).stroke();
        doc.font(isHeader ? "Helvetica-Bold" : "Helvetica").fontSize(isHeader ? 8 : 7);
        doc.text(String(text), xCell + 2, yPos + 6, { width: colWidths[i] - 4, align: isHeader ? "center" : "left" });
        xCell += colWidths[i];
      });

      return maxHeight;
    };

    // Header Tabel Lampiran
    let currentY = doc.y;
    currentY += drawTableRow(headers, currentY, true);

    // Isi Tabel Lampiran
    rows.forEach((row) => {
      currentY += drawTableRow(row, currentY, false);
    });

    // 8. TANDA TANGAN LAMPIRAN
    if (currentY + 100 > 550) doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
    drawSignature(doc, 600, currentY + 20, 200);

    doc.end();
  } catch (error) {
    console.error("Error generateReport:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ message: "Gagal cetak PDF", error: process.env.NODE_ENV === "development" ? error.message : undefined });
    }
  }
};

// @Deskripsi: Menampilkan daftar tugas yang sudah melewati tahap diteliti untuk dibuatkan surat pengantar
const getVerifiedTasks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1  , parseInt(req.query.limit) || 10));
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
      if (Object.keys(filters.updatedAt).length === 0) {
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
          select: "batchId", // Hanya ambil yang diperlukan
        })
        .select("_id title mainData attachments updatedAt additionalData reportId")
        .lean() // Sangat penting untuk performa read-only
    ]);

    const totalPages = Math.ceil(totalData / limit);

    return res.status(200).json({
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
          reportId: reportId?._id || null, // Tetap sertakan ID asli jika butuh
          displayBatchId: reportId?.batchId || "Belum Ada Batch",
        };
      }),
    });
  } catch (error) {
    console.error("Error getVerifiedTasks:", error);
    return res.status(500).json({
      message: "Gagal mengambil data permohonan yang sudah diteliti.",error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// @Deskripsi: Menambahkan lampiran berupa link Google Drive pada setiap tugas yang sudah diverifikasi untuk dijadikan arsip
const addAttachmentToTask = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.params;
    const { fileName, driveLink } = req.body;

    if (!user) return res
        .status(401)
        .json({ message: "Silahkan login." });
    if (!["admin", "pengarsip"].includes(user.role)) {
      return res.status(403).json({
        message: "Anda tidak memiliki izin untuk mengakses fitur ini.",
      });
    }

    if (!fileName?.trim() || !driveLink?.trim()) {
      return res
        .status(400)
        .json({ message: "Nama file dan Link Drive wajib diisi" });
    }
    if (!driveLink.includes("drive.google.com")) {
      return res.status(400).json({ 
        message: "Link yang dimasukkan harus berupa link Google Drive yang valid" 
      });
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      {
        $push: {
          attachments: {
            fileName: fileName.trim(),
            driveLink: driveLink.trim(),
            uploadedBy: req.user.id,
            uploadedAt: new Date(),
          },
        },
      },
      { 
        new: true, 
        runValidators: true,
        select: "attachments" // Optimasi: Hanya ambil field attachments, bukan seluruh dokumen task
      }
    ).lean();

    if (!task) return res.status(404).json({ message: "Task tidak ditemukan" });

    return res.status(200).json({
      message: "Lampiran berhasil ditambahkan",
      attachments: task.attachments,
    });
  } catch (error) {
    console.error("Error addAttachmentToTask:", error.message);
    return res.status(500).json({ 
      message: "Gagal menambahkan lampiran",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
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
  createReport,
  generateReport,
  getVerifiedTasks,
  addAttachmentToTask,
  getBatchReportsHistory,
  addAttachmentToReport,
};
