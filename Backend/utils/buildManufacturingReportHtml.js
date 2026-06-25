import escapeHtml from "./escapeHtml";

export default buildManufacturingReportHtml = (entries, title) => {
  const rows = entries
    .map((entry, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(entry.productionDate)}</td>
          <td>${escapeHtml(entry.tphBatch)}</td>
          <td>${escapeHtml(entry.batchNo)}</td>
          <td>${escapeHtml(entry.productCategory)}</td>
          <td>${escapeHtml(entry.token)}</td>
          <td>${escapeHtml(entry.color || entry.productColor)}</td>
          <td>${escapeHtml(entry.productName)}</td>
          <td>${escapeHtml(entry.rawMaterialName)}</td>
          <td>${escapeHtml(entry.rawMaterialQty)}</td>
          <td>${escapeHtml(entry.unit)}</td>
          <td>${escapeHtml(entry.bagSize)}</td>
          <td>${escapeHtml(entry.totalBagsProduced)}</td>
          <td>${escapeHtml(entry.wastageQty)}</td>
          <td>${escapeHtml(entry.remarks)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; color: #111827;">
      <h2 style="margin-bottom: 8px;">${escapeHtml(title)}</h2>
      <p style="margin-top: 0;">Total Entries: <strong>${entries.length}</strong></p>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 8px;">S.No.</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Production Date</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">TPH/Batch</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Batch No.</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Product Category</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Token</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Color</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Product Name</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Raw Material</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Raw Material Qty</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Unit</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Bag Size</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Total Bags Produced</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Wastage Qty</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
};
