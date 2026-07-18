function doPost(e) {
  try {
    const payload = e && e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};

    const action = String(payload.action || "").trim();
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = "ProductionDispatch";
    let sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Action",
        "Date",
        "Batch/Challan",
        "Product Category",
        "Product Name",
        "Color",
        "User",
        "TPH Batch",
        "Qty",
        "Bags",
        "Wastage",
        "Remarks",
        "Product Items",
        "Raw Materials",
        "Finished Goods"
      ]);
    }

    if (action === "PRODUCTION") {
      const rows = Array.isArray(payload.productionRows) ? payload.productionRows : [];
      rows.forEach((entry) => {
        const data = entry || {};
        sheet.appendRow([
          "PRODUCTION",
          data.productionDate || "",
          data.batchNo || "",
          data.productCategory || "",
          data.finishedProductName || "",
          data.color || "",
          data.user || "",
          data.tphBatch || "",
          data.materialQuantity || "",
          data.totalCan || "",
          data.wastageQty || "",
          data.remarks || "",
          JSON.stringify(data.productItems || []),
          JSON.stringify(data.rawMaterials || []),
          JSON.stringify(payload.finishedGoods || [])
        ]);
      });
    } else if (action === "DISPATCH") {
      const entry = payload.dispatch || {};
      sheet.appendRow([
        "DISPATCH",
        entry.date || "",
        entry.challanNo || "",
        entry.productCategory || "",
        entry.productName || "",
        entry.productColor || entry.color || "",
        entry.user || "",
        "",
        entry.quantity || "",
        entry.totalBags || "",
        entry.wastageQty || "",
        entry.remarks || "",
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify(payload.finishedGoods || [])
      ]);
    } else if (action === "PING") {
      sheet.appendRow(["PING", new Date().toISOString(), "", "", "", "", "", "", "", "", "", "", "", "", ""]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: "Synced to Google Sheet" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: error.message || "Google Sheet sync failed" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "Apps Script is running" }))
    .setMimeType(ContentService.MimeType.JSON);
}
