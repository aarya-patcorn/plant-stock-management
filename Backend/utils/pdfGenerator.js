const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const LOGO_PATHS = [
  "D:/Aarya/Van Booking System/Frontend/src/assets/new_logo.png",
  path.join(__dirname, "../../Frontend/src/assets/new_logo.png"),
];

const PAGE_MARGIN = 32;
const HEADER_HEIGHT = 110;
const FOOTER_HEIGHT = 72;
const TABLE_FONT_SIZE = 8;
const TABLE_HEADER_FONT_SIZE = 8.5;
const TITLE_COLOR = "#103E7A";
const BORDER_COLOR = "#B7C3D0";
const HEADER_FILL = "#EAF2FB";
const ALT_ROW_FILL = "#F7FAFD";
const BLUE_ACCENT = "#124F9E";
const RED_ACCENT = "#D62D2D";

const collectPdfBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

const safeText = (value) => String(value ?? "").trim();
const pad = (value) => String(value).padStart(2, "0");

const formatDisplayDate = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return safeText(value) || "--/--/----";
  }

  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
};

const normalizeShiftSlug = (shiftName = "") => {
  const value = safeText(shiftName).toLowerCase();

  if (value.includes("first") || value.includes("shift-1") || value.includes("shift 1")) {
    return "Shift-1";
  }

  if (value.includes("second") || value.includes("shift-2") || value.includes("shift 2")) {
    return "Shift-2";
  }

  return safeText(shiftName).replace(/\s+/g, "-") || "Shift";
};

const getManufacturingReportFileName = (reportDate, shiftName) =>
  `Manufacturing_Report_${formatDisplayDate(reportDate)}_${normalizeShiftSlug(shiftName)}.pdf`;

const getDispatchReportFileName = (reportDate) =>
  `Dispatch_Report_${formatDisplayDate(reportDate)}.pdf`;

const resolveLogoPath = () => LOGO_PATHS.find((filePath) => fs.existsSync(filePath)) || null;

const getContentTop = () => PAGE_MARGIN + HEADER_HEIGHT + 10;
const getContentBottom = (doc) => doc.page.height - PAGE_MARGIN - FOOTER_HEIGHT;
const getAvailableWidth = (doc) => doc.page.width - PAGE_MARGIN * 2;

const drawCornerDesign = (doc) => {
  const pageWidth = doc.page.width;

  doc.save();

  doc.fillColor(BLUE_ACCENT);
  doc.polygon(
    [0, 0],
    [88, 0],
    [56, 28],
    [0, 28],
  ).fill();

  doc.fillColor(RED_ACCENT);
  doc.polygon(
    [20, 28],
    [108, 28],
    [76, 56],
    [0, 56],
  ).fill();

  doc.fillColor(BLUE_ACCENT);
  doc.polygon(
    [pageWidth, 0],
    [pageWidth - 88, 0],
    [pageWidth - 56, 28],
    [pageWidth, 28],
  ).fill();

  doc.fillColor(RED_ACCENT);
  doc.polygon(
    [pageWidth - 20, 28],
    [pageWidth - 108, 28],
    [pageWidth - 76, 56],
    [pageWidth, 56],
  ).fill();

  doc.restore();
};

const drawHeader = (doc) => {
  const logoPath = resolveLogoPath();

  drawCornerDesign(doc);

  if (logoPath) {
    const logoWidth = 210;
    const logoHeight = 56;
    doc.image(
      logoPath,
      doc.page.width / 2 - logoWidth / 2,
      PAGE_MARGIN + 2,
      { fit: [logoWidth, logoHeight], align: "center" },
    );
  }

  doc
    .font("Helvetica-Bold")
    .fillColor(TITLE_COLOR)
    .fontSize(16)
    .text(doc._reportTitle || "", PAGE_MARGIN, PAGE_MARGIN + 62, {
      width: getAvailableWidth(doc),
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .fillColor("#111827")
    .fontSize(10)
    .text(`Date: ${doc._reportDateText || formatDisplayDate()}`, PAGE_MARGIN, PAGE_MARGIN + 88, {
      width: getAvailableWidth(doc),
      align: "right",
    });

  doc
    .moveTo(PAGE_MARGIN, PAGE_MARGIN + HEADER_HEIGHT)
    .lineTo(doc.page.width - PAGE_MARGIN, PAGE_MARGIN + HEADER_HEIGHT)
    .lineWidth(1)
    .strokeColor(BORDER_COLOR)
    .stroke();
};

const drawFooter = (doc) => {
  const footerTop = doc.page.height - PAGE_MARGIN - FOOTER_HEIGHT + 10;

  doc
    .moveTo(PAGE_MARGIN, footerTop - 10)
    .lineTo(doc.page.width - PAGE_MARGIN, footerTop - 10)
    .lineWidth(1)
    .strokeColor(BORDER_COLOR)
    .stroke();

  doc
    .font("Helvetica")
    .fillColor("#111827")
    .fontSize(9)
    .text(
      "Sincerely,\n\nGuma Plant\n\nKamdhenu Adhesives Plant, Guma, Raipur, (C.G.)",
      PAGE_MARGIN,
      footerTop,
      {
        width: 260,
        align: "left",
      },
    );

  doc
    .font("Helvetica-Bold")
    .fillColor("#111827")
    .fontSize(9)
    .text(`Page ${doc._pageNumber || 1}`, doc.page.width - PAGE_MARGIN - 80, footerTop + 28, {
      width: 80,
      align: "right",
    });
};

const drawPageChrome = (doc) => {
  drawHeader(doc);
  drawFooter(doc);
};

const createPdfDocument = ({ title, reportDate }) => {
  const doc = new PDFDocument({
    margin: PAGE_MARGIN,
    size: "A4",
    layout: "landscape",
    bufferPages: false,
  });

  doc._reportTitle = title;
  doc._reportDateText = formatDisplayDate(reportDate || new Date());
  doc._pageNumber = 1;
  doc._currentTable = null;

  drawPageChrome(doc);

  doc.on("pageAdded", () => {
    doc._pageNumber += 1;
    drawPageChrome(doc);

    if (doc._currentTable) {
      drawTableHeader(doc, doc._currentTable);
    }
  });

  doc.y = getContentTop();
  return doc;
};

const fitText = (doc, text, width, font = "Helvetica", fontSize = TABLE_FONT_SIZE) => {
  const value = safeText(text) || "-";
  doc.font(font).fontSize(fontSize);

  let output = value;
  const ellipsis = "...";

  while (doc.widthOfString(output) > width - 6 && output.length > 1) {
    output = `${output.slice(0, -1).trimEnd()}${ellipsis}`;
    while (output.endsWith(`${ellipsis}${ellipsis}`)) {
      output = output.replace(`${ellipsis}${ellipsis}`, ellipsis);
    }
  }

  return output;
};

const getRowHeight = (doc, columns, row, options = {}) => {
  const fontSize = options.fontSize || TABLE_FONT_SIZE;
  const cellPadding = options.cellPadding || 4;

  let height = 0;

  columns.forEach((column) => {
    const text = safeText(row[column.key]) || "-";
    const measuredHeight = doc
      .font("Helvetica")
      .fontSize(fontSize)
      .heightOfString(text, {
        width: column.width - cellPadding * 2,
        align: column.align || "left",
      });

    height = Math.max(height, measuredHeight + cellPadding * 2);
  });

  return Math.max(height, 22);
};

const ensureSpaceForRow = (doc, requiredHeight) => {
  const bottom = getContentBottom(doc);
  if (doc.y + requiredHeight <= bottom) {
    return;
  }

  doc.addPage();
  doc.y = (doc._currentTable?.startY || getContentTop()) + doc._currentTable.headerHeight;
};

const drawTableHeader = (doc, tableConfig) => {
  const { columns, startX, startY, headerHeight, cellPadding } = tableConfig;
  let x = startX;

  doc.save();
  doc.fillColor(HEADER_FILL).rect(startX, startY, tableConfig.totalWidth, headerHeight).fill();
  doc.restore();

  columns.forEach((column) => {
    doc
      .lineWidth(0.8)
      .strokeColor(BORDER_COLOR)
      .rect(x, startY, column.width, headerHeight)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(TABLE_HEADER_FONT_SIZE)
      .fillColor("#111827")
      .text(column.label, x + cellPadding, startY + 6, {
        width: column.width - cellPadding * 2,
        align: column.align || "left",
      });

    x += column.width;
  });

  doc.y = startY + headerHeight;
};

const renderTable = (doc, { columns, rows, title }) => {
  if (title) {
    ensureSpaceForRow(doc, 28);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(TITLE_COLOR)
      .text(title, PAGE_MARGIN, doc.y, {
        width: getAvailableWidth(doc),
        align: "left",
      });
    doc.moveDown(0.5);
  }

  const startX = PAGE_MARGIN;
  const startY = doc.y;
  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);
  const headerHeight = 24;
  const cellPadding = 4;

  doc._currentTable = {
    columns,
    startX,
    startY,
    totalWidth,
    headerHeight,
    cellPadding,
  };

  drawTableHeader(doc, doc._currentTable);

  rows.forEach((row, index) => {
    const rowHeight = getRowHeight(doc, columns, row, { fontSize: TABLE_FONT_SIZE, cellPadding });

    ensureSpaceForRow(doc, rowHeight);

    const rowY = doc.y;
    let x = startX;

    if (index % 2 === 1) {
      doc.save();
      doc.fillColor(ALT_ROW_FILL).rect(startX, rowY, totalWidth, rowHeight).fill();
      doc.restore();
    }

    columns.forEach((column) => {
      doc
        .lineWidth(0.8)
        .strokeColor(BORDER_COLOR)
        .rect(x, rowY, column.width, rowHeight)
        .stroke();

      const displayValue = fitText(
        doc,
        row[column.key],
        column.width - cellPadding * 2,
        "Helvetica",
        TABLE_FONT_SIZE,
      );

      doc
        .font("Helvetica")
        .fontSize(TABLE_FONT_SIZE)
        .fillColor("#111827")
        .text(displayValue, x + cellPadding, rowY + 6, {
          width: column.width - cellPadding * 2,
          align: column.align || "left",
        });

      x += column.width;
    });

    doc.y = rowY + rowHeight;
  });

  doc._currentTable = null;
  doc.moveDown(0.8);
};

const buildManufacturingRows = (entries) => {
  const rows = [];
  let serialNumber = 1;

  entries.forEach((entry) => {
    const productItems = Array.isArray(entry.productItems) && entry.productItems.length > 0
      ? entry.productItems
      : [{
        token: entry.token,
        bagSize: entry.bagSize,
        totalBagsProduced: entry.totalBagsProduced,
      }];

    productItems.forEach((item) => {
      rows.push({
        serialNumber,
        productionDate: formatDisplayDate(entry.productionDate),
        tphBatch: safeText(entry.tphBatch),
        user: safeText(entry.user),
        batchNo: safeText(entry.batchNo),
        productCategory: safeText(entry.productCategory),
        color: safeText(entry.color),
        finishedProductName: safeText(entry.finishedProductName || entry.productName),
        token: safeText(item.token),
        bagSize: safeText(item.bagSize),
        totalBagsProduced: Number(item.totalBagsProduced) || 0,
        remarks: safeText(entry.remarks),
      });
      serialNumber += 1;
    });
  });

  return rows;
};

const buildManufacturingSummaryRows = (entries) => {
  const summaryMap = new Map();

  entries.forEach((entry) => {
    const key = safeText(entry.productCategory) || "Unknown";
    const current = summaryMap.get(key) || {
      productCategory: key,
      totalEntries: 0,
      totalBagsProduced: 0,
    };

    const productItems = Array.isArray(entry.productItems) ? entry.productItems : [];
    const totalBagsProduced = productItems.length > 0
      ? productItems.reduce((sum, item) => sum + (Number(item.totalBagsProduced) || 0), 0)
      : (Number(entry.totalBagsProduced) || 0);

    summaryMap.set(key, {
      productCategory: key,
      totalEntries: current.totalEntries + 1,
      totalBagsProduced: current.totalBagsProduced + totalBagsProduced,
    });
  });

  return Array.from(summaryMap.values()).map((item, index) => ({
    serialNumber: index + 1,
    ...item,
  }));
};

const buildDispatchRows = (entries) => entries.map((entry, index) => ({
  serialNumber: index + 1,
  date: formatDisplayDate(entry.date),
  dispatchTime: safeText(entry.dispatchTime),
  user: safeText(entry.user),
  todayVehicleNo: safeText(entry.todayVehicleNo),
  vehicleNo: safeText(entry.vehicleNo),
  productCategory: safeText(entry.productCategory),
  productColor: safeText(entry.productColor),
  productName: safeText(entry.productName),
  bagSize: safeText(entry.bagSize),
  quantity: Number(entry.quantity) || 0,
  totalBags: Number(entry.totalBags) || 0,
  wastageQty: Number(entry.wastageQty) || 0,
}));

const buildDispatchSummaryRows = (entries) => {
  const summaryMap = new Map();

  entries.forEach((entry) => {
    const key = [
      safeText(entry.productCategory) || "Unknown",
      safeText(entry.productName) || "Unknown",
      safeText(entry.bagSize) || "Unknown",
    ].join("|");

    const current = summaryMap.get(key) || {
      productCategory: safeText(entry.productCategory) || "Unknown",
      productName: safeText(entry.productName) || "Unknown",
      bagSize: safeText(entry.bagSize) || "Unknown",
      totalQuantity: 0,
      totalBags: 0,
      totalWastageQty: 0,
    };

    summaryMap.set(key, {
      ...current,
      totalQuantity: current.totalQuantity + (Number(entry.quantity) || 0),
      totalBags: current.totalBags + (Number(entry.totalBags) || 0),
      totalWastageQty: current.totalWastageQty + (Number(entry.wastageQty) || 0),
    });
  });

  return Array.from(summaryMap.values()).map((item, index) => ({
    serialNumber: index + 1,
    ...item,
  }));
};

const generateManufacturingShiftPdf = async (entries, shiftName) => {
  const firstEntryDate = entries[0]?.createdAt || entries[0]?.productionDate || new Date();
  const doc = createPdfDocument({
    title: "Plant Stock Manufacturing Entries",
    reportDate: firstEntryDate,
  });
  const pdfBufferPromise = collectPdfBuffer(doc);

  const columns = [
    { key: "serialNumber", label: "S.No.", width: 36, align: "center" },
    { key: "productionDate", label: "Production Date", width: 72 },
    { key: "tphBatch", label: "TPH Batch", width: 62 },
    { key: "user", label: "User", width: 54 },
    { key: "batchNo", label: "Batch No", width: 56 },
    { key: "productCategory", label: "Product Category", width: 78 },
    { key: "color", label: "Color", width: 50 },
    { key: "finishedProductName", label: "Finished Product Name", width: 92 },
    { key: "token", label: "Token", width: 48 },
    { key: "bagSize", label: "Bag Size", width: 52 },
    { key: "totalBagsProduced", label: "Total Bags Produced", width: 70, align: "right" },
    { key: "remarks", label: "Remarks", width: 96 },
  ];

  const summaryColumns = [
    { key: "serialNumber", label: "S.No.", width: 40, align: "center" },
    { key: "productCategory", label: "Product Category", width: 180 },
    { key: "totalEntries", label: "Total Entries", width: 120, align: "right" },
    { key: "totalBagsProduced", label: "Total Bags Produced", width: 150, align: "right" },
  ];

  renderTable(doc, {
    title: shiftName ? `Shift: ${safeText(shiftName)}` : undefined,
    columns,
    rows: buildManufacturingRows(entries),
  });

  renderTable(doc, {
    title: "Production Summary",
    columns: summaryColumns,
    rows: buildManufacturingSummaryRows(entries),
  });

  doc.end();
  return pdfBufferPromise;
};

const generateDispatchDailyPdf = async (entries) => {
  const firstEntryDate = entries[0]?.createdAt || entries[0]?.date || new Date();
  const doc = createPdfDocument({
    title: "Plant Stock Dispatch Entries",
    reportDate: firstEntryDate,
  });
  const pdfBufferPromise = collectPdfBuffer(doc);

  const columns = [
    { key: "serialNumber", label: "S.No.", width: 36, align: "center" },
    { key: "date", label: "Date", width: 64 },
    { key: "dispatchTime", label: "Dispatch Time", width: 70 },
    { key: "user", label: "User", width: 58 },
    { key: "todayVehicleNo", label: "Today Vehicle No", width: 74, align: "center" },
    { key: "vehicleNo", label: "Vehicle No", width: 72 },
    { key: "productCategory", label: "Product Category", width: 76 },
    { key: "productColor", label: "Product Color", width: 68 },
    { key: "productName", label: "Product Name", width: 82 },
    { key: "bagSize", label: "Bag Size", width: 54 },
    { key: "quantity", label: "Quantity", width: 52, align: "right" },
    { key: "totalBags", label: "Total Bags", width: 58, align: "right" },
    { key: "wastageQty", label: "Wastage Qty", width: 64, align: "right" },
  ];

  const summaryColumns = [
    { key: "serialNumber", label: "S.No.", width: 40, align: "center" },
    { key: "productCategory", label: "Product Category", width: 140 },
    { key: "productName", label: "Product Name", width: 160 },
    { key: "bagSize", label: "Bag Size", width: 90 },
    { key: "totalQuantity", label: "Total Quantity", width: 110, align: "right" },
    { key: "totalBags", label: "Total Bags", width: 110, align: "right" },
    { key: "totalWastageQty", label: "Total Wastage Qty", width: 130, align: "right" },
  ];

  renderTable(doc, {
    columns,
    rows: buildDispatchRows(entries),
  });

  renderTable(doc, {
    title: "Dispatch Summary",
    columns: summaryColumns,
    rows: buildDispatchSummaryRows(entries),
  });

  doc.end();
  return pdfBufferPromise;
};

module.exports = {
  generateManufacturingShiftPdf,
  generateDispatchDailyPdf,
  getManufacturingReportFileName,
  getDispatchReportFileName,
};
