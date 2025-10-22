const PDFDocument = require("pdfkit");
const Task = require("../models/Task");
const {
  allocateNumbersForTasks,
} = require("../services/allocateNumbersForTasks");
const dayjs = require("dayjs");

// Path logo (sesuaikan jika perlu)
const path = require("path");
const LOGO_PATH = path.resolve(__dirname, "./assets/logo-kab.png");

// Formatter tanggal "DD MMMM YYYY" lokal Indonesia
const fmtDateID = (d = new Date()) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);

const exportSuratPengantarPDF = async (req, res) => {
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

    const { updates, batchId, year } = await allocateNumbersForTasks(tasks);

    const nomor = Math.min(...tasks.map((t) => t.noSuratPengantar));
    const nomorPengantar = `973/${nomor}-UPT.PD.WIL.IV/${year}`;
    const tanggal = fmtDateID(new Date()); // ← gantikan moment()
    const jenisPelayanan = uniqueTitles[0].replace(/_/g, " ");

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=surat_pengantar_${nomor}.pdf`
    );
    doc.pipe(res);

    // =======================================================
    // PAGE 1 : Surat Rekomendasi (seperti MS-21)
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
      { align: "center" }
    );

    // Logo kiri-atas header
    try {
      const topY = doc.page.margins.top; // default 50
      doc.image(LOGO_PATH, doc.page.margins.left - 2, topY - 10, {
        fit: [100, 70],
        align: "left",
        valign: "top",
      });
    } catch {}

    // Garis tebal
    const lineY = doc.y + 5;
    doc
      .moveTo(doc.page.margins.left, lineY)
      .lineTo(doc.page.width - doc.page.margins.right, lineY)
      .lineWidth(2)
      .stroke();

    doc.moveDown(2);

    // Lebar konten
    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startY = doc.y;

    // Nomor (kiri) & Tanggal (kanan)
    doc.text(`Nomor    : ${nomorPengantar}`, doc.page.margins.left, startY, {
      align: "left",
    });
    doc.text(`Tigaraksa, ${tanggal}`, doc.page.margins.left, startY, {
      width: contentWidth,
      align: "right",
    });

    doc.moveDown(1);

    // Lampiran & Hal
    let totalTasks = 0;
    tasks.forEach((task) => {
      totalTasks += task.additionalData.length;
    });

    doc.text(`Lampiran : ${totalTasks} Berkas`);
    doc.text(
      `Hal           : Rekomendasi Permohonan ${jenisPelayanan} SPPT Tahun ${year}`
    );
    doc.moveDown(1);

    // Tujuan
    doc.text("Yth. Kepala Badan Pendapatan Daerah");
    doc.text(
      "Cq. Kepala Bidang Pendataan, Penilaian, dan Penetapan Pajak Daerah"
    );
    doc.text("di");
    doc.text("Tempat");
    doc.moveDown(1);

    doc.text(
      `Dipermaklumkan dengan hormat, bersama ini kami sampaikan data permohonan ${jenisPelayanan} SPPT PBB Tahun ${year} pada pelayanan tatap muka UPTD Wilayah IV sebagai berikut:`,
      { align: "justify" }
    );
    doc.moveDown(1);

    // ===== Tabel ringkas jumlah berkas =====
    const tableStartX = doc.x;
    let tableY = doc.y;

    const ringkasHeaders = ["NO AGENDA", "JENIS", "JUMLAH", "KETERANGAN"];
    const ringkasValues = [
      String(nomor),
      jenisPelayanan,
      `${totalTasks} Berkas`,
      "Rincian Berkas Terlampir",
    ];

    // total = 495 (A4 portrait - margin 50 kiri/kanan)
    const ringkasWidths = [90, 140, 100, 165];
    const rowHeight = 25;

    // Header
    let x = tableStartX;
    doc.lineWidth(1);
    ringkasHeaders.forEach((header, i) => {
      const w = ringkasWidths[i];
      doc.rect(x, tableY, w, rowHeight).stroke();
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(header, x + 4, tableY + 8, {
          width: w - 8,
          align: "center",
        });
      x += w;
    });
    tableY += rowHeight;

    // Values
    x = tableStartX;
    doc.lineWidth(1);
    ringkasValues.forEach((val, i) => {
      const w = ringkasWidths[i];
      doc.rect(x, tableY, w, rowHeight).stroke();
      doc
        .font("Helvetica")
        .fontSize(9)
        .text(val, x + 4, tableY + 8, {
          width: w - 8,
          align: "center",
        });
      x += w;
    });

    // Setelah tabel ringkas
    tableY += rowHeight;
    doc.moveDown(2);

    const fullWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const startX = doc.page.margins.left;

    doc.font("Helvetica").fontSize(11);
    doc.text(
      `Sehubungan dengan hal ini, bahwa berkas permohonan ${jenisPelayanan} SPPT PBB tersebut sudah melalui proses penelitian/verifikasi dan diarsipkan sebagaimana mestinya (data terlampir).`,
      startX,
      doc.y,
      { width: fullWidth, align: "justify" }
    );
    doc.moveDown(2);

    doc.text(
      "Demikian surat rekomendasi ini kami sampaikan, atas perhatiannya diucapkan terimakasih.",
      startX,
      doc.y,
      { width: fullWidth, align: "justify" }
    );
    doc.moveDown(2);

    // Footer halaman 1 (kanan)
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const halfWidth = pageWidth / 2;
    const footerX = doc.page.margins.left + halfWidth + 40;
    const footerWidth1 = halfWidth;

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
    // PAGE 2 : Tabel Rincian Task
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
    if (rows.length === 0)
      rows.push(["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"]);

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
          }) + 8
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
      if (y + neededHeight > doc.page.height - doc.page.margins.bottom - 100) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 10 });
        y = doc.y;
        rowH = drawRow(headers, y, true);
        y += rowH;
      }
      y += neededHeight;
    });

    // Footer halaman (kanan bawah tabel)
    const footerY = y + 40;
    let x2 = startX2;
    for (let i = 0; i < colWidths.length - 4; i++) x2 += colWidths[i];
    const footerWidth = colWidths.slice(-4).reduce((a, b) => a + b, 0);

    // Geser kursor ke posisi footer
    doc.y = footerY;
    doc.font("Helvetica").fontSize(10);

    // Baris pertama
    doc.text("Kepala UPTD", x2, doc.y, {
      width: footerWidth,
      align: "center",
    });
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

// @Deskripsi: Menampilkan datar surat pengantar/rekomendasi
// @Route: GET /api/reports/daftar-surat-pengantar
// @Access: Private (semua user role dan admin)
const getDaftarSuratPengantar = async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .json({ message: "Masuk sebagai user role atau admin" });

    // Pagination
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 10; // Define 10 data per page
    const skip = (page - 1) * limit; // Offset atau skip per 10 data

    //Filtering & searching
    const filters = {};
    if (
      req.query.noSuratPengantar !== undefined &&
      req.query.noSuratPengantar !== ""
    ) {
      const noSurat = Number(req.query.noSuratPengantar);
      if (!Number.isFinite(noSurat)) {
        return res.status(400).json({ message: "Data harus berupa angka." });
      }
      filters.noSuratPengantar = noSurat;
    }

    if (req.query.nopel && req.query.nopel.trim() !== "") {
      // Gunakan regex supaya bisa partial search (mirip LIKE di SQL)
      filters["mainData.nopel"] = new RegExp(req.query.nopel.trim(), "i");
    }

    // Counting total of tasks
    const totalTasks = await Task.countDocuments(filters);

    const tasks = await Task.find(filters)
      .sort({ noSuratPengantar: 1, _id: 1 }) // In sort, a number 1 is for ascending order
      .skip(skip)
      .limit(limit)
      .select({
        _id: 1, // In select, a number 1 means include this field and number 0 means exclude
        title: 1,
        noSuratPengantar: 1,
        tahunSuratPengantar: 1,
        "mainData.nop": 1,
        "mainData.nopel": 1,
        additionalData: { $slice: 1 },
      })
      .lean();

    // It tells the browser (or any proxy in between) not to store the response at all
    res.set("Cache-Control", "no-store");

    return res.status(200).json({
      page,
      limit,
      totalTasks,
      tasks,
      filter: {
        ...(filters.noSuratPengantar
          ? { noSuratPengantar: filters.noSuratPengantar }
          : {}),
        ...(filters["mainData.nopel"] ? { nopel: req.query.nopel } : {}),
      },
    });
  } catch (error) {
    console.error("Error getting export summary (tasks):", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil daftar pengantar",
      error: error?.message || String(error),
    });
  }
};

module.exports = { exportSuratPengantarPDF, getDaftarSuratPengantar };
