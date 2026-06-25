import escapeHtml from "./escapeHtml";

export default buildDispatchReportHtml = (entries, title) => {
  const rows = entries
    .map((entry, index) => {
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(entry.date)}</td>
          <td>${escapeHtml(entry.time)}</td>
          <td>${escapeHtml(entry.challanNo)}</td>
          <td>${escapeHtml(entry.challanName)}</td>
          <td>${escapeHtml(entry.vehicleNo)}</td>
          <td>${escapeHtml(entry.driverName)}</td>
          <td>${escapeHtml(entry.driverContact)}</td>
          <td>${escapeHtml(entry.dispatchTime)}</td>
          <td>${escapeHtml(entry.dispatchSite)}</td>
          <td>${escapeHtml(entry.todayVehicleNo)}</td>
          <td>${escapeHtml(entry.token)}</td>
          <td>${escapeHtml(entry.productCategory)}</td>
          <td>${escapeHtml(entry.productColor)}</td>
          <td>${escapeHtml(entry.productName)}</td>
          <td>${escapeHtml(entry.bagSize)}</td>
          <td>${escapeHtml(entry.quantity)}</td>
          <td>${escapeHtml(entry.totalBags)}</td>
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
              <th style="border: 1px solid #d1d5db; padding: 8px;">Date</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Time</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Challan No.</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Challan Name</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Vehicle No.</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Driver Name</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Driver Contact</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Dispatch Time</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Dispatch Site</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Today Vehicle No.</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Token</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Product Category</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Product Color</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Product Name</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Bag Size</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Quantity</th>
              <th style="border: 1px solid #d1d5db; padding: 8px;">Total Bags</th>
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