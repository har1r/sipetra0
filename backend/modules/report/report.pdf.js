const PDFDocument = require("pdfkit");
const path = require("path");

const fmtDateID = (d = new Date()) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);

const LOGO_PATH = path.join(__dirname, "../../assets/logo.png");

module.exports = function buildReportPDF(report) {
  const selectedTasks = report.tasks || [];
  const nomorPengantar = report.batchId;
  const nomor = report.sequence;
  const tanggal = fmtDateID(report.createdAt);
  const rawServiceTitle = selectedTasks[0]?.title || "-";
  const jenisPelayanan = rawServiceTitle.replace(/_/g, " ");

  const marginLeft = 50;
  const marginRight = 50;
  const contentWidth = 595 - marginLeft - marginRight;

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

  const doc = new PDFDocument({ size: "A4", margin: marginLeft });

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

  // =========================
  // HALAMAN 1
  // =========================

  doc.font("Helvetica").fontSize(11);
  doc.text("PEMERINTAH KABUPATEN TANGERANG", { align: "center" });
  doc.text("BADAN PENDAPATAN DAERAH", { align: "center" });
  doc.fontSize(9);
  doc.text("Gedung Pendapatan Daerah Komp. Perkantoran Tigaraksa", {
    align: "center",
  });
  doc.text("Telp. (021) 599 88333 Fax. (021) 599 88333", {
    align: "center",
  });
  doc.text(
    "Website: bapendatangerangkab.go.id Email : bapenda@tangerangkab.go.id",
    { align: "center" },
  );

  try {
    doc.image(LOGO_PATH, marginLeft - 2, 60, { fit: [100, 70] });
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

  doc.text(
    `Dipermaklumkan dengan hormat, bersama ini kami sampaikan data permohonan ${jenisPelayanan} SPPT PBB Tahun ${report.year} pada pelayanan tatap muka UPTD Wilayah IV sebagai berikut:`,
    { align: "justify", width: contentWidth },
  );

  doc.moveDown(1);

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

  doc.y = tableY + rowHeight + 15;
  doc.x = marginLeft;

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

  drawSignature(doc, 330, doc.y + 30, 200);

  // =========================
  // HALAMAN 2 (LAMPIRAN)
  // =========================

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

    row.forEach((text, i) => {
      const h =
        doc.heightOfString(String(text), {
          width: colWidths[i] - 4,
        }) + 10;
      if (h > maxHeight) maxHeight = h;
    });

    if (yPos + maxHeight > 550) {
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
        .fontSize(isHeader ? 8 : 7)
        .text(String(text), xCell + 2, yPos + 6, {
          width: colWidths[i] - 4,
          align: isHeader ? "center" : "left",
        });

      xCell += colWidths[i];
    });

    return maxHeight;
  };

  let currentY = doc.y;
  currentY += drawTableRow(headers, currentY, true);

  rows.forEach((row) => {
    currentY += drawTableRow(row, currentY, false);
  });

  if (currentY + 100 > 550) {
    doc.addPage({ size: "A4", layout: "landscape", margin: 20 });
  }

  drawSignature(doc, 600, currentY + 20, 200);

  return {
    doc,
    filename: `surat_pengantar_${nomor}.pdf`,
  };
};

module.exports = function buildPartialMutationPDF(task) {
  const doc = new PDFDocument({ size: "A4", margin: 40 });

  const taskId = task._id;
  const nopel = task?.mainData?.nopel || "";

  const colWidths = [100, 110, 170, 65, 70];
  const rowHeight = 20;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("KERTAS KERJA LAYANAN MUTASI SEBAGIAN", { align: "center" });

  doc.moveDown(1);
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text(`Nomor Pelayanan: ${nopel}`);
  doc.moveDown(0.5);

  const tableTop = doc.y;

  const drawHeader = (y) => {
    doc.font("Helvetica-Bold").fontSize(9);
    const headers = ["Keterangan", "NOP", "Nama WP", "LT", "LB"];
    let currentX = 40;

    headers.forEach((h, i) => {
      doc.rect(currentX, y, colWidths[i], rowHeight).stroke();
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
      doc.rect(x, currentY, colWidths[i], rowHeight).stroke();

      const textContent = String(txt || "");
      const availableWidth = colWidths[i] - 6;
      let fontSize = 8;

      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize);

      let textWidth = doc.widthOfString(textContent);
      while (textWidth > availableWidth && fontSize > 6) {
        fontSize -= 0.5;
        doc.fontSize(fontSize);
        textWidth = doc.widthOfString(textContent);
      }

      let textAlignment = "left";
      if (i === 1 || i === 3 || i === 4) {
        textAlignment = "center";
      }

      doc.text(textContent, x + 3, currentY + (rowHeight - fontSize) / 2 - 1, {
        width: availableWidth,
        align: textAlignment,
        lineBreak: false,
        ellipsis: true,
      });

      x += colWidths[i];
    });

    currentY += rowHeight;
  };

  const pieces = task.additionalData || [];

  const totalUsedLand = pieces.reduce((sum, p) => {
    return sum + (parseFloat(p.landWide) || 0);
  }, 0);

  const originalLandWide = parseFloat(task.mainData?.oldlandWide) || 0;
  const remainingLand = originalLandWide - totalUsedLand;

  drawRow(
    "NOP Induk",
    task.mainData?.nop || "-",
    task.mainData?.oldName || "-",
    remainingLand > 0 ? remainingLand.toString() : "0",
    task.mainData?.buildingWide || "0",
    true,
  );

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
    drawRow("Pecahan 1 *)", "", "", "", "");
  }

  doc.moveDown(1);
  doc.font("Helvetica-Bold").text("Titik Koordinat:", 40, currentY + 10);
  doc.rect(40, currentY + 25, 515, 200).stroke();

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

  return {
    doc,
    filename: `kertas_kerja_ms_${taskId}.pdf`,
  };
};
