function doPost(e) {
  try {
    const payload = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = String(payload.action || "").trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, "ProductionDispatch", ["Action","Date","Batch/Challan","Product Category","Product Name","Color","User","TPH Batch","Qty","Bags","Wastage","Remarks","Product Items","Raw Materials","Finished Goods"]);
    const fg = getOrCreateSheet(ss, "Finished Goods", ["Product Category","Product Name","Token","Color","Bag Size","Quantity"]);
    if (action === "PRODUCTION_ENTRY") {
      const d = payload.production || {};
      sheet.appendRow(["PRODUCTION",d.productionDate||"",d.batchNo||"",d.productCategory||"",d.finishedProductName||"",d.color||"",d.user||"",d.tphBatch||"",d.materialQuantity||"",d.totalCan||"",d.wastageQty||"",d.remarks||"",JSON.stringify(d.productItems||[]),JSON.stringify(d.rawMaterials||[]),""]);
      updateFinishedGoodsRows(fg, payload.productMaterialRows, 1);
    } else if (action === "DISPATCH_ENTRY") {
      const d = payload.dispatch || {};
      sheet.appendRow(["DISPATCH",d.date||"",d.challanNo||"",d.productCategory||"",d.productName||"",d.productColor||d.color||"",d.user||"","",d.quantity||"",d.totalBags||"",d.wastageQty||"",d.remarks||"",JSON.stringify([]),JSON.stringify([]),""]);
      updateFinishedGoodsRows(fg, payload.productMaterialRows, -1);
    } else if (action === "PING") {
      sheet.appendRow(["PING",new Date().toISOString(),"","","","","","","","","","","","",""]);
    } else throw new Error("Unsupported sync action: " + action);
    return ContentService.createTextOutput(JSON.stringify({success:true,message:"Synced to Google Sheet"})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({success:false,message:error.message||"Google Sheet sync failed"})).setMimeType(ContentService.MimeType.JSON);
  }
}
function getOrCreateSheet(ss,name,headers) {
  let s=ss.getSheetByName(name); if (!s) s=ss.insertSheet(name); if (s.getLastRow()===0) s.appendRow(headers); return s;
}
function updateFinishedGoodsRows(sheet,rows,direction) {
  (Array.isArray(rows)?rows:[]).forEach(function(c) {
    const values=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,6).getValues():[];
    const i=values.findIndex(function(r){return String(r[0])===String(c.productCategory||"")&&String(r[1])===String(c.productName||"")&&String(r[2])===String(c.token||"")&&String(r[3])===String(c.color||"")&&String(r[4])===String(c.bagSize||"");});
    if (i<0) { sheet.appendRow([c.productCategory||"",c.productName||"",c.token||"",c.color||"",c.bagSize||"",direction*Number(c.quantity||0)]); return; }
    const row=i+2, q=Number(sheet.getRange(row,6).getValue())||0;
    sheet.getRange(row,6).setValue(q+direction*Number(c.quantity||0));
  });
}
function doGet(e) { return ContentService.createTextOutput(JSON.stringify({success:true,message:"Apps Script is running"})).setMimeType(ContentService.MimeType.JSON); }
