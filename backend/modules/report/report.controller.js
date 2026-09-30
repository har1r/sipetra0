const PDFDocument = require("pdfkit");
const path = require("path");
const service = require("../report/report.service");
const ExcelJS = require("exceljs");

const getVerifiedTasks = async (req, res, next) => {
  try {
    const result = await service.getVerifiedTasksService(req.query);

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
    return res.status(200).json({ result });
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

const generateReports = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Silahkan login." });
    // if (!["admin", "peneliti"].includes(user.role)) {
    //   return res.status(403).json({ message: "Izin akses ditolak." });
    // }

    const result = await service.preparePdfData(reportId);
    console.log(result);
    const { report, fixServiceTitle, tableRows, totalData, formatDate } =
      result;

    // Inisialisasi PDF Document
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const LOGO_PATH = path.join(__dirname, "/assets/logo-kab.png");
    const marginLeft = 50;
    const marginRight = 50;
    const contentWidth = 595 - marginLeft - marginRight;

    // Error handling stream
    doc.on("error", (err) => {
      if (!res.headersSent)
        res.status(500).send("Kesalahan pembuatan dokumen.");
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=surat_pengantar_${report.sequence}.pdf`,
    );

    doc.pipe(res);

    // HELPER: Fungsi Tanda Tangan
    const drawSignature = (d, x, y, width) => {
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

    // --- HEADER KOP SURAT ---
    doc
      .font("Helvetica")
      .fontSize(11)
      .text("PEMERINTAH KABUPATEN TANGERANG", { align: "center" });
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

    // --- INFORMASI SURAT ---
    const topInfoY = doc.y;
    doc.font("Helvetica").fontSize(10);
    doc.text(`Nomor     : ${report.batchId}`, marginLeft, topInfoY);
    doc.text(`Tigaraksa, ${formatDate}`, marginLeft, topInfoY, {
      width: contentWidth,
      align: "right",
    });

    doc.text(`Lampiran : ${totalData} Berkas`);
    doc.text(
      `Hal           : Rekomendasi Permohonan ${fixServiceTitle} SPPT Tahun ${report.year}`,
    );
    doc.moveDown(1.5);

    doc.text("Yth. Kepala Badan Pendapatan Daerah");
    doc.text(
      "Cq. Kepala Bidang Pendataan, Penilaian, dan Penetapan Pajak Daerah",
    );
    doc.text("di");
    doc.text("Tempat");
    doc.moveDown(1.5);

    doc.text(
      `Dipermaklumkan dengan hormat, bersama ini kami sampaikan data permohonan ${fixServiceTitle} SPPT PBB Tahun ${report.year} pada pelayanan tatap muka UPTD Wilayah IV sebagai berikut:`,
      { align: "justify", width: contentWidth },
    );
    doc.moveDown(1);

    // --- TABEL RINGKASAN ---
    let tableY = doc.y;
    const ringkasHeaders = ["NO AGENDA", "JENIS", "JUMLAH", "KETERANGAN"];
    const ringkasValues = [
      String(report.sequence),
      fixServiceTitle,
      `${totalData} Berkas`,
      "Rincian Berkas Terlampir",
    ];
    const ringkasWidths = [90, 140, 100, 165];
    const rowHeight = 25;

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

    // --- PENUTUP HALAMAN 1 ---
    doc.y = tableY + rowHeight + 15;
    doc.x = marginLeft;
    doc.font("Helvetica").fontSize(10);
    doc.text(
      `Sehubungan dengan hal ini, bahwa berkas permohonan ${fixServiceTitle} SPPT PBB tersebut sudah melalui proses penelitian/verifikasi dan diarsipkan sebagaimana mestinya (data terlampir).`,
      { align: "justify", width: contentWidth },
    );
    doc.moveDown(1);
    doc.text(
      "Demikian surat rekomendasi ini kami sampaikan, atas perhatiannya diucapkan terimakasih.",
      {
        align: "justify",
        width: contentWidth,
      },
    );

    drawSignature(doc, 330, doc.y + 30, 200);

    // --- HALAMAN 2: LAMPIRAN (LANDSCAPE) ---
    doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
    doc.font("Helvetica").fontSize(9);
    doc.text(`Nomor      : ${report.batchId}`);
    doc.text(`Tanggal    : ${formatDate}`);
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
      row.forEach((text, i) => {
        const h =
          doc.heightOfString(String(text), { width: colWidths[i] - 4 }) + 10;
        if (h > maxHeight) maxHeight = h;
      });

      if (yPos + maxHeight > 540) {
        doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
        yPos = 20;
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
      return yPos + maxHeight;
    };

    let currentY = doc.y;
    currentY = drawTableRow(headers, currentY, true);

    tableRows.forEach((row) => {
      currentY = drawTableRow(row, currentY, false);
    });

    if (currentY + 100 > 540) {
      doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
      currentY = 20;
    }
    drawSignature(doc, 600, currentY + 20, 200);

    doc.end();
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const generatePartialMutations = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Silahkan login." });
    // if (!["admin", "peneliti"].includes(user.role)) {
    //   return res.status(403).json({ message: "Izin akses ditolak." });
    // }

    const result = await service.preparePartialMutationData(taskId);
    console.log(result);
    const { task, pieces, remainingLand } = result;

    // Inisialisasi PDF
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    // Error handling stream
    doc.on("error", (err) => {
      if (!res.headersSent)
        res.status(500).send("Kesalahan pembuatan dokumen.");
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=kertas_kerja_ms_${taskId}.pdf`,
    );
    doc.pipe(res);

    // --- LOGIKA LAYOUT PDF ---
    const colWidths = [100, 110, 170, 65, 70];
    const rowHeight = 20;
    const startX = 40;

    // Header Judul
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("KERTAS KERJA LAYANAN MUTASI SEBAGIAN", { align: "center" });
    doc.moveDown(1);
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Nomor Pelayanan: ${task.mainData?.nopel || ""}`);
    doc.moveDown(0.5);

    let currentY = doc.y;

    const drawTableHeader = (y) => {
      doc.font("Helvetica-Bold").fontSize(9);
      let hX = startX;
      ["Keterangan", "NOP", "Nama WP", "LT", "LB"].forEach((h, i) => {
        doc.rect(hX, y, colWidths[i], rowHeight).stroke();
        doc.text(h, hX, y + 6, { width: colWidths[i], align: "center" });
        hX += colWidths[i];
      });
    };

    // Helper: Draw Row
    const drawRow = (label, nop, wp, lt, lb, isBold = false) => {
      if (currentY + rowHeight > 750) {
        doc.addPage({ size: "A4", margin: 40 });
        currentY = 40;
        drawTableHeader(currentY);
        currentY += rowHeight;
      }

      let x = startX;
      const data = [label, nop, wp, lt, lb];

      data.forEach((txt, i) => {
        doc.rect(x, currentY, colWidths[i], rowHeight).stroke();
        const textContent = String(txt || "");
        let fontSize = 8;
        doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize);

        // Anti-potong logic
        const availableWidth = colWidths[i] - 6;
        while (
          doc.widthOfString(textContent) > availableWidth &&
          fontSize > 6
        ) {
          fontSize -= 0.5;
          doc.fontSize(fontSize);
        }

        const align = i === 1 || i === 3 || i === 4 ? "center" : "left";
        doc.text(
          textContent,
          x + 3,
          currentY + (rowHeight - fontSize) / 2 - 1,
          {
            width: availableWidth,
            align: align,
            lineBreak: false,
            ellipsis: true,
          },
        );
        x += colWidths[i];
      });
      currentY += rowHeight;
    };

    // Draw Table Header
    drawTableHeader(currentY);
    currentY += rowHeight;

    // 1. Baris NOP Induk (Sisa Tanah)
    drawRow(
      "NOP Induk",
      task.mainData?.nop || "-",
      task.mainData?.oldName || "-",
      remainingLand,
      task.mainData?.buildingWide || "0",
      true,
    );

    // 2. Baris Pecahan
    if (pieces.length > 0) {
      pieces.forEach((p, idx) => {
        drawRow(
          `Pecahan ${idx + 1} *)`,
          p.nop || "",
          p.newName || "",
          p.landWide || "0",
          p.buildingWide || "0",
        );
      });
    } else {
      drawRow("Pecahan 1 *)", "", "", "", "");
    }

    // Pengecekan sisa halaman untuk Kotak Koordinat & Tanda Tangan (~280px)
    if (currentY + 280 > 750) {
      doc.addPage({ size: "A4", margin: 40 });
      currentY = 40;
    }

    // Koordinat Box
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Titik Koordinat:", startX, currentY + 10);
    doc.rect(startX, currentY + 25, 515, 200).stroke();

    // Footer Signatures
    currentY += 240;
    const footerWidth = 515 / 4;
    ["UPT", "Bidang Pelayanan", "Subbid Penetapan", "Petugas Peta"].forEach(
      (label, i) => {
        const fX = startX + i * footerWidth;
        doc.rect(fX, currentY, footerWidth, 60).stroke();
        doc.fontSize(8).text(label, fX, currentY + 5, {
          width: footerWidth,
          align: "center",
        });
      },
    );

    currentY += 65;
    doc
      .font("Helvetica-Oblique")
      .fontSize(7)
      .text("*) Diisi oleh petugas di Bidang", startX, currentY + 10);

    doc.end();
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const addAttachmentToTasks = async (req, res) => {
  try {
    const user = req.user;
    const { taskId } = req.params;

    if (!user) return res.status(401).json({ message: "Silahkan login." });
    if (!["admin", "pengarsip"].includes(user.role)) {
      return res.status(403).json({ message: "Izin akses ditolak." });
    }

    const attachment = await service.addAttachmentTask(
      taskId,
      req.body,
      user._id,
    );

    return res.status(200).json({
      message: "Lampiran berhasil ditambahkan",
      attachment,
    });
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const deleteAttachmentFromTask = async (req, res) => {
  try {
    const user = req.user;
    const { taskId, attachmentId } = req.params;

    if (!user) return res.status(401).json({ message: "Silahkan login." });

    if (!["admin", "pengarsip"].includes(user.role)) {
      return res.status(403).json({ message: "Izin akses ditolak." });
    }

    // Memanggil Service
    const remainingAttachments = await service.removeAttachmentTask(
      taskId,
      attachmentId,
    );

    return res.status(200).json({
      message: "Lampiran berhasil dihapus",
      data: remainingAttachments, // Mengirim daftar lampiran terbaru setelah dihapus
    });
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const addAttachmentToReports = async (req, res) => {
  try {
    const user = req.user;
    const { reportId } = req.params;

    if (!user) return res.status(401).json({ message: "Silahkan login." });
    if (!["admin", "pengarsip"].includes(user.role)) {
      return res.status(403).json({ message: "Izin akses ditolak." });
    }

    const attachment = await service.addAttachmentReport(
      reportId,
      req.body,
      user._id,
    );

    return res.status(200).json({
      message: "Lampiran berhasil ditambahkan",
      attachment,
    });
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const voidReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const user = req.user;

    if (!user || !["admin", "peneliti"].includes(user.role)) {
      return res.status(403).json({ message: "Izin akses ditolak." });
    }

    const result = await service.PrepareVoidReport(reportId);

    return res.status(200).json({
      message:
        "Surat pengantar berhasil dibatalkan (VOID) dan permohonan telah dilepaskan.",
      batchId: result.reportId,
    });
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const parseNop = (nop = "") => {
  if (!nop) nop = "";
  const clean = nop.replace(/\D/g, "");
  if (clean.length === 18) {
    return {
      prov: clean.substring(0, 2),
      kab: clean.substring(2, 4),
      kec: clean.substring(4, 7),
      kel: clean.substring(7, 10),
      blok: clean.substring(10, 13),
      urut: clean.substring(13, 17),
      status: clean.substring(17, 18)
    };
  }
  const parts = nop.trim().split(/[\s\.-]+/);
  if (parts.length >= 7) {
    return {
      prov: parts[0],
      kab: parts[1],
      kec: parts[2],
      kel: parts[3],
      blok: parts[4],
      urut: parts[5],
      status: parts[6]
    };
  }
  return {
    prov: nop,
    kab: "",
    kec: "",
    kel: "",
    blok: "",
    urut: "",
    status: ""
  };
};

const parseAddress = (fullAddress = "") => {
  if (!fullAddress) fullAddress = "";
  const rtMatch = fullAddress.match(/rt\s*[:\.-]?\s*(\d+)/i);
  const rwMatch = fullAddress.match(/rw\s*[:\.-]?\s*(\d+)/i);
  const rt = rtMatch ? rtMatch[1].padStart(3, "0") : "";
  const rw = rwMatch ? rwMatch[1].padStart(3, "0") : "";
  
  let cleanAddress = fullAddress
    .replace(/(?:rt\s*[:\.-]?\s*\d+)/gi, "")
    .replace(/(?:rw\s*[:\.-]?\s*\d+)/gi, "")
    .replace(/[\/\s-,]+$/, "")
    .replace(/[\/\s-,]+/g, " ")
    .trim();
    
  return { rt, rw, cleanAddress };
};

const parseCertificate = (certificate = "") => {
  if (!certificate) certificate = "";
  const trimmed = certificate.trim();
  if (!trimmed) return { jenis: "", no: "" };
  
  const match = trimmed.match(/^([a-zA-Z]+)\s+(.+)$/);
  if (match) {
    return {
      jenis: match[1],
      no: match[2]
    };
  }
  return { jenis: trimmed, no: "" };
};

const toUpperStr = (val) => {
  if (val === undefined || val === null) return "";
  return String(val).toUpperCase();
};

const toNumberVal = (val) => {
  if (val === undefined || val === null || val === "") return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const generateExcelReports = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const user = req.user;

    if (!user) return res.status(401).json({ message: "Silahkan login." });

    const { report, tasks } = await service.prepareExcelData(reportId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Detail Surat Pengantar");

    // Define column mapping keys and width
    worksheet.columns = [
      { key: "nopel", width: 25 },
      { key: "nop_prov", width: 5 },
      { key: "nop_kab", width: 5 },
      { key: "nop_kec", width: 7 },
      { key: "nop_kel", width: 7 },
      { key: "nop_blok", width: 7 },
      { key: "nop_urut", width: 9 },
      { key: "nop_status", width: 5 },
      { key: "newName", width: 25 },
      { key: "oldName", width: 25 },
      { key: "address", width: 35 },
      { key: "blok", width: 8 },
      { key: "rt", width: 6 },
      { key: "rw", width: 6 },
      { key: "subdistrict", width: 20 },
      { key: "village", width: 20 },
      { key: "title", width: 20 },
      { key: "landWide", width: 12 },
      { key: "buildingWide", width: 12 },
      { key: "cert_jenis", width: 10 },
      { key: "cert_no", width: 20 },
    ];

    // Row 1: Header Utama
    const row1Values = [];
    row1Values[1] = "NO PELAYANAN";
    row1Values[2] = "NOP INDUK";
    row1Values[9] = "NAMA PEMOHON";
    row1Values[10] = "NAMA WP INDUK";
    row1Values[11] = "LOKASI OBJEK PAJAK";
    row1Values[17] = "JENIS PELAYANAN";
    row1Values[18] = "LUAS";
    row1Values[20] = "ALAS HAK";
    worksheet.addRow(row1Values);

    // Row 2: Sub Header
    const row2Values = [];
    row2Values[2] = "";
    row2Values[3] = "";
    row2Values[4] = "";
    row2Values[5] = "";
    row2Values[6] = "";
    row2Values[7] = "";
    row2Values[8] = "";
    row2Values[11] = "ALAMAT OP";
    row2Values[12] = "BLOK";
    row2Values[13] = "RT";
    row2Values[14] = "RW";
    row2Values[15] = "KECAMATAN";
    row2Values[16] = "DESA/KEL";
    row2Values[18] = "TANAH";
    row2Values[19] = "BANGUNAN";
    row2Values[20] = "JENIS";
    row2Values[21] = "NO";
    worksheet.addRow(row2Values);

    // Merge Header Cells
    worksheet.mergeCells("A1:A2");
    worksheet.mergeCells("B1:H1");
    worksheet.mergeCells("I1:I2");
    worksheet.mergeCells("J1:J2");
    worksheet.mergeCells("K1:P1");
    worksheet.mergeCells("Q1:Q2");
    worksheet.mergeCells("R1:S1");
    worksheet.mergeCells("T1:U1");

    // Add Data Rows
    tasks.forEach((task) => {
      const adds = task.additionalData && task.additionalData.length > 0 ? task.additionalData : [{}];
      
      adds.forEach((addData) => {
        const nopParts = parseNop(task.mainData?.nop);
        const addrInfo = parseAddress(task.mainData?.address);
        const certInfo = parseCertificate(addData.certificate);

        worksheet.addRow({
          nopel: toUpperStr(task.mainData?.nopel),
          nop_prov: toUpperStr(nopParts.prov),
          nop_kab: toUpperStr(nopParts.kab),
          nop_kec: toUpperStr(nopParts.kec),
          nop_kel: toUpperStr(nopParts.kel),
          nop_blok: toUpperStr(nopParts.blok),
          nop_urut: toUpperStr(nopParts.urut),
          nop_status: toUpperStr(nopParts.status),
          newName: toUpperStr(addData.newName),
          oldName: toUpperStr(task.mainData?.oldName),
          address: toUpperStr(addrInfo.cleanAddress),
          blok: "", // Kosongkan sesuai template
          rt: toUpperStr(addrInfo.rt),
          rw: toUpperStr(addrInfo.rw),
          subdistrict: toUpperStr(task.mainData?.subdistrict),
          village: toUpperStr(task.mainData?.village),
          title: toUpperStr(task.title),
          landWide: toNumberVal(addData.landWide),
          buildingWide: toNumberVal(addData.buildingWide),
          cert_jenis: toUpperStr(certInfo.jenis),
          cert_no: toUpperStr(certInfo.no),
        });
      });
    });

    // Style the sheet, headers, grid lines and borders
    worksheet.views = [{ showGridLines: true }];
    worksheet.getRow(1).height = 24;
    worksheet.getRow(2).height = 20;

    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (rowNumber <= 2) {
          // Headers
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "000000" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "46C0D2" }
          };
          cell.border = {
            top: { style: "thin", color: { argb: "000000" } },
            left: { style: "thin", color: { argb: "000000" } },
            bottom: { style: "thin", color: { argb: "000000" } },
            right: { style: "thin", color: { argb: "000000" } }
          };
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        } else {
          // Data
          cell.font = { name: "Arial", size: 9, color: { argb: "000000" } };
          cell.border = {
            top: { style: "thin", color: { argb: "9CA3AF" } },
            left: { style: "thin", color: { argb: "9CA3AF" } },
            bottom: { style: "thin", color: { argb: "9CA3AF" } },
            right: { style: "thin", color: { argb: "9CA3AF" } }
          };
          
          const colIndex = cell.col;
          if (
            (colIndex >= 2 && colIndex <= 8) ||
            colIndex === 12 || // BLOK
            colIndex === 13 || // RT
            colIndex === 14 || // RW
            colIndex === 18 || // Luas Tanah
            colIndex === 19    // Luas Bangunan
          ) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }
        }
      });
    });

    // Format safe batch name for the filename
    const safeBatchId = report.batchId.replace(/[\/\\?%*:|"<>]/g, "_");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=surat_pengantar_${safeBatchId}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("FULL ERROR OBJECT:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

const getReportKpiStats = async (req, res, next) => {
  try {
    const result = await service.getReportKpiStatsService(req.query);
    return res.status(200).json({ result });
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
  generateReports,
  generateExcelReports,
  generatePartialMutations,
  addAttachmentToTasks,
  deleteAttachmentFromTask,
  addAttachmentToReports,
  voidReport,
  getReportKpiStats,
};

