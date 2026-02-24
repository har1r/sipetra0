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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = req.user;
    const { selectedTaskIds } = req.body;

    if (!user) return res.status(401).json({ message: "Silahkan login." });
    if (!["admin", "peneliti"].includes(user.role))
      return res.status(403).json({ message: "Izin akses ditolak." });

    if (!Array.isArray(selectedTaskIds) || selectedTaskIds.length === 0)
      return res
        .status(400)
        .json({ message: "Pilih minimal satu permohonan." });

    // 1. Ambil data Task dan Populasikan data Report-nya untuk cek status
    const selectedTasks = await Task.find({ _id: { $in: selectedTaskIds } })
      .populate("reportId") // Kita butuh data reportId untuk cek status VOID
      .session(session);

    if (selectedTasks.length !== selectedTaskIds.length) {
      return res
        .status(404)
        .json({ message: "Beberapa permohonan tidak ditemukan." });
    }

    // 2. Validasi Jenis Pelayanan (Tetap seperti permintaan Anda)
    const titles = new Set(selectedTasks.map((task) => task.title));
    if (titles.size > 1) {
      return res.status(400).json({ message: "Jenis pelayanan harus sama." });
    }

    // --- LOGIC PENYELARASAN VOID ---

    // Filter Task yang benar-benar sudah punya Report AKTIF (bukan VOID)
    const tasksWithActiveReport = selectedTasks.filter(
      (task) => task.reportId && task.reportId.status !== "VOID",
    );

    // Jika ada Task yang terikat ke Report FINAL/DRAFT, cegah pencampuran
    if (
      tasksWithActiveReport.length > 0 &&
      tasksWithActiveReport.length < selectedTasks.length
    ) {
      return res.status(400).json({
        message:
          "Tidak boleh mencampur permohonan baru dengan yang sudah memiliki laporan aktif.",
      });
    }

    // Jika SEMUA task sudah punya report yang sama dan AKTIF, gunakan yang lama
    if (tasksWithActiveReport.length === selectedTasks.length) {
      const firstReportId = tasksWithActiveReport[0].reportId._id;

      // Pastikan semua berasal dari 1 report yang sama
      const uniqueReports = new Set(
        tasksWithActiveReport.map((t) => t.reportId._id.toString()),
      );
      if (uniqueReports.size > 1) {
        return res.status(400).json({
          message: "Tugas berasal dari beberapa laporan aktif berbeda.",
        });
      }

      await session.abortTransaction();
      return res.status(200).json({
        message: "Menggunakan nomor pengantar yang sudah ada.",
        data: { batchId: firstReportId },
      });
    }

    // 3. Buat Report Baru (Hanya jika Task tidak punya report atau report lamanya VOID)
    const newReport = new Report({
      tasks: selectedTaskIds,
      generatedBy: user._id,
      status: "FINAL",
      // Jangan lupa tambahkan year dan sequence sesuai model Report Anda sebelumnya
      year: new Date().getFullYear(),
    });

    await newReport.save({ session });

    // 4. Update Task dengan ID Report Baru
    await Task.updateMany(
      { _id: { $in: selectedTaskIds } },
      { $set: { reportId: newReport._id } },
      { session },
    );

    await session.commitTransaction();

    return res.status(200).json({
      message: "Nomor surat pengantar berhasil dibuat.",
      data: { batchId: newReport._id },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error createReport:", error.message);
    return res.status(500).json({
      message: "Gagal membuat nomor pengantar baru.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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

    if (!user) return res.status(401).json({ message: "Silahkan login." });
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
          addData.landWide || "0",
          addData.buildingWide || "0",
          addData.certificate || "-",
        ]);
      });
    });

    // 2. Inisialisasi PDF
    const doc = new PDFDocument({ size: "A4", margin: marginLeft });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=surat_pengantar_${nomor}.pdf`,
    );
    doc.pipe(res);

    // HELPER: Fungsi Tanda Tangan agar konsisten di semua halaman
    const drawSignature = (d, x, y, width, label) => {
      d.y = y;
      d.x = x;
      d.font("Helvetica").fontSize(10);
      d.text("Kepala UPTD", { width, align: "center" });
      d.text("Pajak Daerah Wilayah IV", { width, align: "center" });
      d.moveDown(4);
      d.font("Helvetica-Bold").text("ASEP SUANDI, SH., M.Si", {
        width,
        align: "center",
      });
      d.font("Helvetica").text("NIP. 19800630 200801 1 006", {
        width,
        align: "center",
      });
    };

    // 3. HEADER PDF (Halaman 1)
    doc.font("Helvetica").fontSize(11);
    doc.text("PEMERINTAH KABUPATEN TANGERANG", { align: "center" });
    doc.text("BADAN PENDAPATAN DAERAH", { align: "center" });
    doc.fontSize(9);
    doc.text("Gedung Pendapatan Daerah Komp. Perkantoran Tigaraksa", {
      align: "center",
    });
    doc.text("Telp. (021) 599 88333 Fax. (021) 599 88333", { align: "center" });
    doc.text(
      "Website: bapendatangerangkab.go.id Email : bapenda@tangerangkab.go.id",
      { align: "center" },
    );

    try {
      doc.image(LOGO_PATH, marginLeft - 2, 40, { fit: [100, 70] });
    } catch (e) {
      console.error("Logo tidak ditemukan:", e.message);
    }

    const lineY = 115;
    doc
      .moveTo(marginLeft, lineY)
      .lineTo(595 - marginRight, lineY)
      .lineWidth(2)
      .stroke();
    doc.moveDown(3);

    // 4. INFORMASI SURAT
    const topInfoY = doc.y;
    doc.font("Helvetica").fontSize(10);
    doc.text(`Nomor     : ${nomorPengantar}`, marginLeft, topInfoY);
    doc.text(`Tigaraksa, ${tanggal}`, marginLeft, topInfoY, {
      width: contentWidth,
      align: "right",
    });

    doc.text(`Lampiran : ${totalBerkas} Berkas`);
    doc.text(
      `Hal           : Rekomendasi Permohonan ${jenisPelayanan} SPPT Tahun ${report.year}`,
    );
    doc.moveDown(1.5);

    doc.text("Yth. Kepala Badan Pendapatan Daerah");
    doc.text(
      "Cq. Kepala Bidang Pendataan, Penilaian, dan Penetapan Pajak Daerah",
    );
    doc.text("di");
    doc.text("Tempat");
    doc.moveDown(1.5);

    // Paragraf 1
    doc.text(
      `Dipermaklumkan dengan hormat, bersama ini kami sampaikan data permohonan ${jenisPelayanan} SPPT PBB Tahun ${report.year} pada pelayanan tatap muka UPTD Wilayah IV sebagai berikut:`,
      { align: "justify", width: contentWidth },
    );
    doc.moveDown(1);

    // 5. TABEL RINGKASAN
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

    // Draw Header Tabel
    let currentX = marginLeft;
    ringkasHeaders.forEach((header, i) => {
      doc.rect(currentX, tableY, ringkasWidths[i], rowHeight).stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(header, currentX + 4, tableY + 8, {
          width: ringkasWidths[i] - 8,
          align: "center",
        });
      currentX += ringkasWidths[i];
    });

    // Draw Value Tabel
    tableY += rowHeight;
    currentX = marginLeft;
    ringkasValues.forEach((val, i) => {
      doc.rect(currentX, tableY, ringkasWidths[i], rowHeight).stroke();
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(val, currentX + 4, tableY + 8, {
          width: ringkasWidths[i] - 8,
          align: "center",
        });
      currentX += ringkasWidths[i];
    });

    // 6. PARAGRAF PENUTUP (Alignment diperbaiki)
    doc.y = tableY + rowHeight + 15;
    doc.x = marginLeft; // Reset X agar sejajar
    doc.font("Helvetica").fontSize(10);

    doc.text(
      `Sehubungan dengan hal ini, bahwa berkas permohonan ${jenisPelayanan} SPPT PBB tersebut sudah melalui proses penelitian/verifikasi dan diarsipkan sebagaimana mestinya (data terlampir).`,
      { align: "justify", width: contentWidth },
    );

    doc.moveDown(1);
    doc.text(
      "Demikian surat rekomendasi ini kami sampaikan, atas perhatiannya diucapkan terimakasih.",
      { align: "justify", width: contentWidth },
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
    const headers = [
      "NO",
      "NOPEL",
      "NOP",
      "NAMA PEMOHON",
      "NAMA SPPT",
      "ALAMAT OP",
      "DESA",
      "KEC",
      "JENIS",
      "LT",
      "LB",
      "BUKTI",
    ];

    const drawTableRow = (row, yPos, isHeader = false) => {
      let maxHeight = 0;

      // Hitung tinggi baris berdasarkan teks terpanjang
      row.forEach((text, i) => {
        const h =
          doc.heightOfString(String(text), { width: colWidths[i] - 4 }) + 10;
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
          doc
            .font("Helvetica-Bold")
            .fontSize(8)
            .text(h, xHeader + 2, yPos + 6, {
              width: colWidths[i] - 4,
              align: "center",
            });
          xHeader += colWidths[i];
        });
        yPos += 20;
      }

      let xCell = 20;
      row.forEach((text, i) => {
        doc.rect(xCell, yPos, colWidths[i], maxHeight).stroke();
        doc
          .font(isHeader ? "Helvetica-Bold" : "Helvetica")
          .fontSize(isHeader ? 8 : 7);
        doc.text(String(text), xCell + 2, yPos + 6, {
          width: colWidths[i] - 4,
          align: isHeader ? "center" : "left",
        });
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
    if (currentY + 100 > 550)
      doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
    drawSignature(doc, 600, currentY + 20, 200);

    doc.end();
  } catch (error) {
    console.error("Error generateReport:", error.message);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Gagal cetak PDF",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
};

const generatePartialMutation = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Pastikan menggunakan Task model sesuai permintaan
    const task = await Task.findById(taskId).lean();

    if (!task) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    // 1. Inisialisasi PDF (A4 Portrait)
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    // 2. Error handling untuk stream
    // Jika terjadi error saat proses streaming data PDF
    doc.on("error", (err) => {
      console.error("PDF Generator Error:", err);
      if (!res.headersSent) {
        res.status(500).send("Terjadi kesalahan pembuatan dokumen.");
      }
    });

    // 3. Set Header
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=kertas_kerja_ms_${taskId}.pdf`,
    );

    // 4. Pipe stream ke response
    doc.pipe(res);

    // --- ISI DOKUMEN ---

    // Header & Judul
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("KERTAS KERJA LAYANAN MUTASI SEBAGIAN", { align: "center" });
    doc.moveDown(1);

    doc.font("Helvetica-Bold").fontSize(10);
    const nopel = task?.mainData?.nopel || "";
    doc.text(`Nomor Pelayanan: ${nopel}`, { align: "left" });
    doc.moveDown(0.5);

    // Tabel Keterangan
    const tableTop = doc.y;
    // REVISI LEBAR KOLOM: NOP diperkecil, Nama WP diperlebar
    // Total lebar tetap 515 (pas dengan margin A4 40 kiri & 40 kanan)
    const colWidths = [100, 110, 170, 65, 70];
    const rowHeight = 20;

    const drawHeader = (y) => {
      doc.font("Helvetica-Bold").fontSize(9);
      const headers = ["Keterangan", "NOP", "Nama WP", "LT", "LB"];
      let currentX = 40;
      headers.forEach((h, i) => {
        doc.rect(currentX, y, colWidths[i], rowHeight).stroke();

        // Header dibuat rata tengah (center) agar seragam
        doc.text(h, currentX, y + 6, {
          width: colWidths[i],
          align: "center",
        });
        currentX += colWidths[i];
      });
    };

    drawHeader(tableTop);
    let currentY = tableTop + rowHeight;

    const drawRow = (label, nop, wp, lt, lb, isBold = false) => {
      let x = 40;
      const data = [label, nop, wp, lt, lb];

      data.forEach((txt, i) => {
        // 1. Gambar kotak border
        doc.rect(x, currentY, colWidths[i], rowHeight).stroke();

        const textContent = String(txt || "");
        const availableWidth = colWidths[i] - 6; // Padding 3 kiri, 3 kanan
        let fontSize = 8;

        // Tentukan font
        doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize);

        // 2. LOGIKA ANTI-POTONG: Kecilkan font otomatis jika teks masih terlalu panjang
        let textWidth = doc.widthOfString(textContent);
        while (textWidth > availableWidth && fontSize > 6) {
          fontSize -= 0.5;
          doc.fontSize(fontSize);
          textWidth = doc.widthOfString(textContent);
        }

        // 3. Tentukan Alignment
        // NOP (i=1), LT (i=3), dan LB (i=4) dibuat rata tengah (center)
        let textAlignment = "left";
        if (i === 1 || i === 3 || i === 4) {
          textAlignment = "center";
        }

        // 4. Tulis teks ke PDF
        doc.text(
          textContent,
          x + 3,
          currentY + (rowHeight - fontSize) / 2 - 1,
          {
            width: availableWidth,
            align: textAlignment,
            lineBreak: false,
            ellipsis: true, // Pengaman terakhir jika font 6 tetap tidak muat
          },
        );

        x += colWidths[i];
      });
      currentY += rowHeight;
    };

    // 1. Ambil data pecahan
    const pieces = task.additionalData || [];

    // 2. Hitung total luas yang sudah dialokasikan ke semua pecahan
    const totalUsedLand = pieces.reduce((sum, p) => {
      const wide = parseFloat(p.landWide) || 0;
      return sum + wide;
    }, 0);

    // 3. Ambil Luas Tanah Awal dari mainData (menggunakan properti oldLandWide sesuai info Anda)
    const originalLandWide = parseFloat(task.mainData?.oldlandWide) || 0;

    // 4. Hitung Sisa (Luas Awal - Total Pecahan)
    const remainingLand = originalLandWide - totalUsedLand;

    // 5. Gambar Baris NOP Induk dengan nilai Sisa
    drawRow(
      "NOP Induk",
      task.mainData?.nop || "-",
      task.mainData?.oldName || "-",
      remainingLand > 0 ? remainingLand.toString() : "0", // Menampilkan sisa hasil pengurangan
      task.mainData?.buildingWide || "0",
      true,
    );

    // 6. Tampilkan baris pecahan secara dinamis
    if (pieces.length > 0) {
      pieces.forEach((pData, index) => {
        drawRow(
          `Pecahan ${index + 1} *)`,
          pData?.nop || "",
          pData?.newName || "",
          pData?.landWide || "0",
          pData?.buildingWide || "0",
        );
      });
    } else {
      // Jika tidak ada data pecahan sama sekali
      drawRow("Pecahan 1 *)", "", "", "", "");
    }

    doc.moveDown(1);
    doc.font("Helvetica-Bold").text("Titik Koordinat:", 40, currentY + 10);
    doc.rect(40, currentY + 25, 515, 200).stroke();

    // Footer / Tanda Tangan
    currentY += 240;
    const footerWidth = 515 / 4;
    const footerLabels = [
      "UPT",
      "Bidang Pelayanan",
      "Subbid Penetapan",
      "Petugas Peta",
    ];

    let footerX = 40;
    footerLabels.forEach((label) => {
      doc.rect(footerX, currentY, footerWidth, 60).stroke();
      doc.fontSize(8).text(label, footerX, currentY + 5, {
        width: footerWidth,
        align: "center",
      });
      footerX += footerWidth;
    });

    doc.moveDown(5);
    doc
      .font("Helvetica-Oblique")
      .fontSize(7)
      .text("*) Diisi oleh petugas di Bidang", 40);

    // Selesaikan Dokumen
    doc.end();
  } catch (error) {
    console.error("Controller Error:", error);
    // Cek apakah header sudah dikirim, jika belum baru kirim JSON error
    if (!res.headersSent) {
      res
        .status(500)
        .json({ message: "Gagal membuat PDF", error: error.message });
    }
  }
};

// @Deskripsi: Menampilkan daftar tugas yang sudah melewati tahap diteliti untuk dibuatkan surat pengantar
const getVerifiedTasks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
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
        .select(
          "_id title mainData attachments updatedAt additionalData reportId",
        )
        .lean(), // Sangat penting untuk performa read-only
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
      message: "Gagal mengambil data permohonan yang sudah diteliti.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @Deskripsi: Menambahkan lampiran berupa link Google Drive pada setiap tugas yang sudah diverifikasi untuk dijadikan arsip
const addAttachmentToTask = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.params;
    const { fileName, driveLink } = req.body;

    if (!user) return res.status(401).json({ message: "Silahkan login." });
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
        message:
          "Link yang dimasukkan harus berupa link Google Drive yang valid",
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
        select: "attachments", // Optimasi: Hanya ambil field attachments, bukan seluruh dokumen task
      },
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
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// @Deskripsi: Menampilkan daftar surat pengantar beserta informasi terkait untuk keperluan monitoring dan manajemen arsip
const getReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const {
      batchId,
      status,
      startDate,
      endDate,
      sortOrder = "desc",
    } = req.query;

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
      if (Object.keys(filters.createdAt).length === 0) {
        delete filters.createdAt;
      }
    }

    const sortingDirection = sortOrder === "asc" ? 1 : -1;

    const [totalData, reports] = await Promise.all([
      mongoose.model("Report").countDocuments(filters),
      mongoose
        .model("Report")
        .find(filters)
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
        totalTasks: totalAdditionalEntries, // Menghitung total entri data tambahan
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
      reports: formattedReports,
    });
  } catch (error) {
    console.error("Error getReports:", error.message);
    return res.status(500).json({
      message: "Gagal memuat data laporan.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const addAttachmentToReport = async (req, res) => {
  try {
    const user = req.user;
    const { reportId } = req.params;
    const { driveLink } = req.body;

    if (!user) return res.status(401).json({ message: "Silahkan login." });
    if (!["admin", "pengarsip"].includes(user.role)) {
      return res.status(403).json({
        message: "Anda tidak memiliki izin untuk mengakses fitur ini.",
      });
    }

    if (!driveLink?.trim()) {
      return res.status(400).json({
        message: "Link Google Drive wajib diisi",
      });
    }

    if (!driveLink.includes("drive.google.com")) {
      return res.status(400).json({
        message:
          "Link yang dimasukkan harus berupa link Google Drive yang valid",
      });
    }

    const report = await mongoose
      .model("Report")
      .findByIdAndUpdate(
        reportId,
        {
          $set: { driveLink: driveLink.trim() },
        },
        {
          new: true,
          runValidators: true,
          select: "batchId driveLink", // Optimasi: Hanya ambil field yang diperlukan
        },
      )
      .lean();

    if (!report) {
      return res.status(404).json({ message: "Laporan tidak ditemukan" });
    }

    return res.status(200).json({
      message: "Lampiran berhasil ditambahkan",
      data: {
        batchId: report.batchId,
        driveLink: report.driveLink,
      },
    });
  } catch (error) {
    console.error("Error addAttachmentToReport:", error.message);
    return res.status(500).json({
      message: "Gagal menambahkan lampiran",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const voidReport = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Mengganti id menjadi reportId dari params
    const { reportId } = req.params;
    console.log("Attempting to void report with ID:", reportId);
    const user = req.user;

    // 1. Validasi user
    if (!user || !["admin", "peneliti"].includes(user.role)) {
      return res.status(403).json({ message: "Izin akses ditolak." });
    }

    // Mencari report berdasarkan reportId
    const report = await Report.findById(reportId).session(session);
    if (!report) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Report tidak ditemukan." });
    }

    if (report.status === "VOID") {
      await session.abortTransaction();
      return res
        .status(400)
        .json({ message: "Report sudah dalam status VOID." });
    }

    // 2. Ubah status report menjadi VOID
    report.status = "VOID";
    await report.save({ session });

    // 3. BERSIHKAN JEJAK DI TASK
    // Gunakan reportId untuk mencari task yang terkait
    await Task.updateMany(
      { reportId: reportId },
      { $set: { reportId: null } },
      { session },
    );

    await session.commitTransaction();
    res.status(200).json({
      message:
        "Report berhasil dibatalkan (VOID) dan permohonan telah dilepaskan.",
      batchId: reportId, // Mengembalikan reportId yang di-void
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error voidReport:", error.message);
    res.status(500).json({
      message: "Gagal membatalkan report.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createReport,
  generateReport,
  generatePartialMutation,
  getVerifiedTasks,
  addAttachmentToTask,
  getReports,
  addAttachmentToReport,
  voidReport,
};
