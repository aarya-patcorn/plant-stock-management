const PurchaseEntry = require("../model/PurchaseEntry");
const Inventory = require("../model/Inventory");

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

const normalizePurchaseData = (data) => {
  const quantityPurchased = convertToKg(data.quantityPurchased ?? data.purchaseStock, data.unit);

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
    attachFile: data.attachFile || "",
    remarks: data.remarks || "",
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

  if (inventory.purchaseStock < quantity) {
    throw new Error("Cannot reduce stock. Stock already used in production.");
  }

  inventory.purchaseStock = Math.max(0, inventory.purchaseStock - quantity);
  inventory.currentStock = Math.max(0, inventory.currentStock - quantity);
  await inventory.save();
};

const createPurchaseEntry = async (req, res) => {
  try {
    const purchaseData = normalizePurchaseData(req.body);
    const purchase = await PurchaseEntry.create(purchaseData);
    await addPurchaseToInventory(purchaseData, purchaseData.quantityPurchased);

    res.status(201).json({ success: true, message: "Purchase entry created successfully", data: purchase });
  } catch (error) {
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

    const newPurchaseData = normalizePurchaseData(req.body);
    await reducePurchaseFromInventory(oldPurchase, parseNumber(oldPurchase.quantityPurchased));

    const updatedPurchase = await PurchaseEntry.findByIdAndUpdate(req.params.id, newPurchaseData, {
      new: true,
      runValidators: true,
    });

    await addPurchaseToInventory(newPurchaseData, newPurchaseData.quantityPurchased);
    res.json({ success: true, message: "Purchase entry updated successfully", data: updatedPurchase });
  } catch (error) {
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
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPurchaseEntry,
  getPurchaseEntries,
  updatePurchaseEntry,
  deletePurchaseEntry,
};