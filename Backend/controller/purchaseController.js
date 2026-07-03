const PurchaseEntry = require("../model/PurchaseEntry");
const Inventory = require("../model/Inventory");
const uploadFileToDriveViaAppsScript = require("../config/googleAppsScriptUpload");
const { sendEmailWithAttachment } = require("../utils/resendMailer");

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const compactFilter = (fields) =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
  );

const normalizeText = (value) => String(value || "").trim();

const hasValue = (value) => {
  if (value === 0) return true;
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return String(value).trim() !== "";
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const parsePurchaseItems = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(trimmedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (_error) {
    return [];
  }
};

const shouldUseCouponField = (data) =>
  normalizeText(data?.rawMaterialName) === "Packaging" &&
  normalizeText(data?.packagingType) === "FG" &&
  normalizeText(data?.level2) === "Tile Adhesive";

const convertToKg = (quantity, unit) => {
  const qty = parseNumber(quantity);
  const normalizedUnit = normalizeText(unit).toLowerCase();

  if (["mt", "ton", "tons", "tonne", "tonnes"].includes(normalizedUnit)) {
    return qty * 1000;
  }

  return qty;
};

const normalizeStoredUnit = (unit) => {
  const normalizedUnit = normalizeText(unit).toLowerCase();

  if (["mt", "ton", "tons", "tonne", "tonnes"].includes(normalizedUnit)) {
    return "kg";
  }

  return unit || "";
};

const normalizeAttachmentFields = (data, existingPurchase = null, uploadedAttachment = null) => {
  if (uploadedAttachment) {
    return {
      attachFile: normalizeText(uploadedAttachment.fileUrl),
      attachFileName: normalizeText(uploadedAttachment.fileName),
      attachFileId: normalizeText(uploadedAttachment.fileId),
    };
  }

  const attachFile = normalizeText(data.attachFile);
  const attachFileName = normalizeText(data.attachFileName);
  const attachFileId = normalizeText(data.attachFileId);

  if (attachFile || attachFileName || attachFileId) {
    return {
      attachFile,
      attachFileName,
      attachFileId,
    };
  }

  return {
    attachFile: normalizeText(existingPurchase?.attachFile),
    attachFileName: normalizeText(existingPurchase?.attachFileName),
    attachFileId: normalizeText(existingPurchase?.attachFileId),
  };
};

const normalizePurchaseData = (data, existingPurchase = null, uploadedAttachment = null) => {
  const normalizedUnit = normalizeStoredUnit(data.unit);
  const quantityPurchased = convertToKg(data.quantityPurchased ?? data.purchaseStock, data.unit);
  const attachmentFields = normalizeAttachmentFields(data, existingPurchase, uploadedAttachment);

  return {
    date: data.date || "",
    time: data.time || "",
    user: data.user || "",
    rawMaterialName: data.rawMaterialName || "",
    packagingType: data.packagingType || "",
    level2: data.level2 || "",
    level3: data.level3 || "",
    level4: data.level4 || data.packagingBag || data.bucketSize || "",
    packagingBagColor: data.packagingBagColor || data.bagColor || "",
    coupon: shouldUseCouponField(data) ? normalizeText(data.coupon) : "",
    bucketSize: data.bucketSize || "",
    bagColor: data.bagColor || data.packagingBagColor || "",
    sandEpoxyColor: data.sandEpoxyColor || data.colorOfSandEpoxy || "",
    quantityPurchased,
    purchaseStock: quantityPurchased,
    unit: normalizedUnit,
    supplierName: data.supplierName || "",
    invoiceNo: data.invoiceNo || "",
    unloadBy: data.unloadBy || "",
    remarks: data.remarks || "",
    ...attachmentFields,
  };
};

const buildInventoryFilter = (data) =>
  compactFilter({
    rawMaterialName: data.rawMaterialName || "",
    packagingType: data.packagingType || "",
    level2: data.level2 || "",
    level3: data.level3 || "",
    level4: data.level4 || "",
    packagingBagColor: data.packagingBagColor || data.bagColor || "",
    coupon: shouldUseCouponField(data) ? normalizeText(data.coupon) : "",
    bucketSize: data.bucketSize || "",
    bagColor: data.bagColor || data.packagingBagColor || "",
    sandEpoxyColor: data.sandEpoxyColor || "",
  });


const addPurchaseToInventory = async (purchaseData, quantity) => {
  const filter = buildInventoryFilter(purchaseData);
  const inventory = await Inventory.findOne(filter);
  const inventoryUnit = normalizeStoredUnit(purchaseData.unit);

  if (!inventory) {
    await Inventory.create({
      ...filter,
      purchaseStock: quantity,
      usedInProduction: 0,
      currentStock: quantity,
      unit: inventoryUnit,
    });
    return;
  }

  inventory.purchaseStock += quantity;
  inventory.currentStock += quantity;
  inventory.unit = inventoryUnit;
  await inventory.save();
};

const reducePurchaseFromInventory = async (purchaseData, quantity) => {
  const filter = buildInventoryFilter(purchaseData);
  const inventory = await Inventory.findOne(filter);

  if (!inventory) {
    throw new Error("Inventory item not found");
  }

  if (inventory.currentStock < quantity) {
    throw new Error("Cannot reduce stock. Stock already used in production.");
  }

  inventory.purchaseStock = Math.max(0, inventory.purchaseStock - quantity);
  inventory.currentStock = Math.max(0, inventory.currentStock - quantity);
  await inventory.save();
};

const sameInventoryTarget = (left, right) =>
  JSON.stringify(buildInventoryFilter(left)) === JSON.stringify(buildInventoryFilter(right));

const updatePurchaseInventory = async (oldPurchaseData, newPurchaseData) => {
  const oldQuantity = parseNumber(oldPurchaseData.quantityPurchased);
  const newQuantity = parseNumber(newPurchaseData.quantityPurchased);

  if (sameInventoryTarget(oldPurchaseData, newPurchaseData)) {
    const filter = buildInventoryFilter(oldPurchaseData);
    const inventory = await Inventory.findOne(filter);

    if (!inventory) {
      throw new Error("Inventory item not found");
    }

    const delta = newQuantity - oldQuantity;

    if (delta < 0 && inventory.currentStock < Math.abs(delta)) {
      throw new Error("Cannot reduce stock. Stock already used in production.");
    }

    inventory.purchaseStock += delta;
    inventory.currentStock += delta;
    inventory.unit = normalizeStoredUnit(newPurchaseData.unit);
    await inventory.save();
    return;
  }

  const oldFilter = buildInventoryFilter(oldPurchaseData);
  const oldInventory = await Inventory.findOne(oldFilter);

  if (!oldInventory) {
    throw new Error("Existing inventory item not found");
  }

  if (oldInventory.currentStock < oldQuantity) {
    throw new Error("Cannot move purchase entry. Some stock is already used in production.");
  }

  oldInventory.purchaseStock = Math.max(0, oldInventory.purchaseStock - oldQuantity);
  oldInventory.currentStock = Math.max(0, oldInventory.currentStock - oldQuantity);
  await oldInventory.save();

  await addPurchaseToInventory(newPurchaseData, newQuantity);
};

const buildPurchaseEmailItems = ({ sourceItems, savedEntries }) =>
  savedEntries.map((entry, index) => {
    const sourceItem = Array.isArray(sourceItems) ? sourceItems[index] || {} : {};

    return {
      rawMaterialName: sourceItem.rawMaterialName ?? entry.rawMaterialName,
      packagingType: sourceItem.packagingType ?? entry.packagingType,
      level2: sourceItem.level2 ?? entry.level2,
      level3: sourceItem.level3 ?? entry.level3,
      level4: sourceItem.level4 ?? entry.level4,
      packagingBag: sourceItem.packagingBag ?? "",
      bucketSize: sourceItem.bucketSize ?? entry.bucketSize,
      packagingBagColor: sourceItem.packagingBagColor ?? entry.packagingBagColor,
      colorOfSandEpoxy: sourceItem.colorOfSandEpoxy ?? sourceItem.sandEpoxyColor ?? entry.sandEpoxyColor,
      quantityPurchased: sourceItem.quantityPurchased ?? entry.quantityPurchased,
      unit: sourceItem.unit ?? entry.unit,
      bagQuantity: sourceItem.bagQuantity ?? "",
    };
  });

const sendPurchaseEntryEmailReport = async ({ data, entries, uploadedAttachment }) => {
  const purchaseEntries = Array.isArray(entries) ? entries : [entries];

  if (purchaseEntries.length === 0 || !data) {
    return;
  }

  const sourceItems = parsePurchaseItems(data.purchaseItems);
  const purchaseItems = sourceItems.length > 0
    ? buildPurchaseEmailItems({ sourceItems, savedEntries: purchaseEntries })
    : buildPurchaseEmailItems({ sourceItems: [data], savedEntries: purchaseEntries });

  const attachmentUrl =
    uploadedAttachment?.fileUrl ||
    data.attachFileUrl ||
    data.attachFile ||
    purchaseEntries[0]?.attachFile ||
    "";

  const commonFields = [
    ["Date", data.date],
    ["Time", data.time],
    ["Supplier Name", data.supplierName],
    ["Invoice No", data.invoiceNo],
    ["Unload By", data.unloadBy],
    ["User", data.user],
    ["Remarks", data.remarks],
    ["Attachment", attachmentUrl],
  ].filter(([, value]) => hasValue(value));

  const possibleColumns = [
    ["rawMaterialName", "Raw Material Name"],
    ["packagingType", "Packaging Type"],
    ["level2", "Level 2"],
    ["level3", "Level 3"],
    ["level4", "Level 4"],
    ["packagingBag", "Packaging Bag"],
    ["bucketSize", "Bucket Size"],
    ["packagingBagColor", "Packaging Bag Color"],
    ["colorOfSandEpoxy", "Color Of Sand Epoxy"],
    ["quantityPurchased", "Quantity Purchased"],
    ["unit", "Unit"],
    ["bagQuantity", "Bag Quantity"],
  ].filter(([field]) => purchaseItems.some((item) => hasValue(item[field])));

  const commonFieldsHtml = commonFields.length > 0
    ? `
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
        <tbody>
          ${commonFields
            .map(
              ([label, value]) => `
                <tr>
                  <td style="font-weight:bold;background:#f5f5f5;">${escapeHtml(label)}</td>
                  <td>${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    `
    : "";

  const tableHeadHtml = `
    <tr>
      <th>S.No.</th>
      ${possibleColumns
        .map(([, label]) => `<th>${escapeHtml(label)}</th>`)
        .join("")}
    </tr>
  `;

  const tableBodyHtml = purchaseItems
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          ${possibleColumns
            .map(([field]) => `<td>${hasValue(item[field]) ? escapeHtml(item[field]) : ""}</td>`)
            .join("")}
        </tr>
      `,
    )
    .join("");

  await sendEmailWithAttachment({
    subject: "New Purchase Entry Added",
    html: `
      <h2>New Purchase Entry Added</h2>
      ${commonFieldsHtml}
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
        <thead>
          ${tableHeadHtml}
        </thead>
        <tbody>
          ${tableBodyHtml}
        </tbody>
      </table>
    `,
  });
};

const createPurchaseEntry = async (req, res) => {
  try {
    let uploadedAttachment = null;

    if (req.file) {
      try {
        uploadedAttachment = await uploadFileToDriveViaAppsScript(req.file);
      } catch (error) {
        console.error("Apps Script upload failed:", error);
        return res.status(500).json({ success: false, message: error.message || "Unable to upload attachment via Apps Script." });
      }
    }

    const purchaseItems = parsePurchaseItems(req.body.purchaseItems);

    if (purchaseItems.length > 0) {
      const commonPurchaseFields = {
        date: req.body.date || "",
        time: req.body.time || "",
        user: req.body.user || "",
        supplierName: req.body.supplierName || "",
        invoiceNo: req.body.invoiceNo || "",
        unloadBy: req.body.unloadBy || "",
        remarks: req.body.remarks || "",
        attachFile: req.body.attachFile || "",
        attachFileName: req.body.attachFileName || "",
        attachFileId: req.body.attachFileId || "",
      };

      const normalizedPurchaseItems = purchaseItems.map((item) =>
        normalizePurchaseData(
          {
            ...commonPurchaseFields,
            ...item,
          },
          null,
          uploadedAttachment,
        )
      );

      const purchases = await PurchaseEntry.insertMany(normalizedPurchaseItems);

      for (const purchaseData of normalizedPurchaseItems) {
        await addPurchaseToInventory(purchaseData, purchaseData.quantityPurchased);
      }

      try {
        await sendPurchaseEntryEmailReport({ data: req.body, entries: purchases, uploadedAttachment });
        console.log("[Purchase Email] Sent successfully for multi-item purchase save.");
      } catch (emailError) {
        console.error("[Purchase Email] Failed for multi-item purchase save:", emailError.message);
      }

      return res.status(201).json({
        success: true,
        message: "Purchase entries created successfully",
        data: purchases,
      });
    }

    const purchaseData = normalizePurchaseData(req.body, null, uploadedAttachment);
    const purchase = await PurchaseEntry.create(purchaseData);
    await addPurchaseToInventory(purchaseData, purchaseData.quantityPurchased);

    try {
      await sendPurchaseEntryEmailReport({ data: req.body, entries: purchase, uploadedAttachment });
      console.log("[Purchase Email] Sent successfully for single purchase save.");
    } catch (emailError) {
      console.error("[Purchase Email] Failed for single purchase save:", emailError.message);
    }

    res.status(201).json({ success: true, message: "Purchase entry created successfully", data: purchase });
  } catch (error) {
    console.error("Create purchase entry error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPurchaseEntries = async (_req, res) => {
  try {
    const purchases = await PurchaseEntry.find().sort({ createdAt: -1 });
    res.json({ success: true, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePurchaseEntry = async (req, res) => {
  try {
    const oldPurchase = await PurchaseEntry.findById(req.params.id);

    if (!oldPurchase) {
      return res.status(404).json({ success: false, message: "Purchase entry not found" });
    }

    let uploadedAttachment = null;

    if (req.file) {
      try {
        uploadedAttachment = await uploadFileToDriveViaAppsScript(req.file);
      } catch (error) {
        console.error("Apps Script upload failed:", error);
        return res.status(500).json({ success: false, message: error.message || "Unable to upload attachment via Apps Script." });
      }
    }

    const newPurchaseData = normalizePurchaseData(req.body, oldPurchase, uploadedAttachment);
    await updatePurchaseInventory(oldPurchase, newPurchaseData);

    const updatedPurchase = await PurchaseEntry.findByIdAndUpdate(req.params.id, newPurchaseData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: "Purchase entry updated successfully", data: updatedPurchase });
  } catch (error) {
    console.error("Update purchase entry error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePurchaseEntry = async (req, res) => {
  try {
    const purchase = await PurchaseEntry.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase entry not found" });
    }

    await reducePurchaseFromInventory(purchase, parseNumber(purchase.quantityPurchased));
    await PurchaseEntry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Purchase entry deleted successfully and inventory reduced" });
  } catch (error) {
    console.error("Delete purchase entry error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPurchaseEntry,
  getPurchaseEntries,
  updatePurchaseEntry,
  deletePurchaseEntry,
};
