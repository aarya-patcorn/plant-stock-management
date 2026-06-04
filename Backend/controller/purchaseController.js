const PurchaseEntry = require("../model/PurchaseEntry");
const Inventory = require("../model/Inventory");
const uploadFileToDriveViaAppsScript = require("../config/googleAppsScriptUpload");

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const compactFilter = (fields) =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
  );

const normalizeText = (value) => String(value || "").trim();

const convertToKg = (quantity, unit) => {
  const qty = parseNumber(quantity);
  const normalizedUnit = normalizeText(unit).toLowerCase();

  if (["mt", "ton", "tons", "tonne", "tonnes"].includes(normalizedUnit)) {
    return qty * 1000;
  }

  return qty;
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
  const quantityPurchased = convertToKg(data.quantityPurchased ?? data.purchaseStock, data.unit);
  const attachmentFields = normalizeAttachmentFields(data, existingPurchase, uploadedAttachment);

  return {
    date: data.date || "",
    time: data.time || "",
    rawMaterialName: data.rawMaterialName || "",
    packagingType: data.packagingType || "",
    level2: data.level2 || "",
    level3: data.level3 || "",
    level4: data.level4 || data.packagingBag || data.bucketSize || "",
    packagingBagColor: data.packagingBagColor || data.bagColor || "",
    bucketSize: data.bucketSize || "",
    bagColor: data.bagColor || data.packagingBagColor || "",
    sandEpoxyColor: data.sandEpoxyColor || data.colorOfSandEpoxy || "",
    quantityPurchased,
    purchaseStock: quantityPurchased,
    unit: data.unit || "",
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
    bucketSize: data.bucketSize || "",
    bagColor: data.bagColor || data.packagingBagColor || "",
    sandEpoxyColor: data.sandEpoxyColor || "",
  });

const getInventoryUnit = (unit) => {
  const normalizedUnit = String(unit || "").toLowerCase();

  if (normalizedUnit === "mt") return "kg";
  if (normalizedUnit === "kg") return "kg";

  return unit;
};

const addPurchaseToInventory = async (purchaseData, quantity) => {
  const filter = buildInventoryFilter(purchaseData);
  const inventory = await Inventory.findOne(filter);
  const inventoryUnit = getInventoryUnit(purchaseData.unit);

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
    inventory.unit = getInventoryUnit(newPurchaseData.unit);
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

    const purchaseData = normalizePurchaseData(req.body, null, uploadedAttachment);
    const purchase = await PurchaseEntry.create(purchaseData);
    await addPurchaseToInventory(purchaseData, purchaseData.quantityPurchased);

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
