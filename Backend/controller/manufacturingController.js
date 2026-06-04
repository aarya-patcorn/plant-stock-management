const ManufacturingEntry = require("../model/ManufacturingEntry");
const Inventory = require("../model/Inventory");
const DispatchEntry = require("../model/DispatchEntry");
const ProductMaterialLog = require("../model/ProductMaterialLog");
const Wastage = require("../model/Wastage");

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const compactFilter = (fields) =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
  );

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const normalizeProductItems = (items = []) => {
  return items.map((item) => ({
    token: item.token || "",
    bagSize: item.bagSize || "",
    totalBagsProduced: parseNumber(item.totalBagsProduced),
  }));
};

const buildRawMaterialFilter = (item) =>
  compactFilter({
    rawMaterialName: item.rawMaterialName || "",
    packagingType: item.packagingType || "",
    level2: item.level2 || "",
    level3: item.level3 || "",
    level4: item.level4 || "",
    packagingBagColor: item.packagingBagColor || item.bagColor || "",
    bucketSize: item.bucketSize || "",
    bagColor: item.bagColor || item.packagingBagColor || "",
    sandEpoxyColor: item.sandEpoxyColor || item.colorOfSandEpoxy || "",
  });

const buildProductMaterialFilter = (data) => {
  return {
    productCategory: data.productCategory || "",
    token: data.token || "",
    color: data.color || "",
    productName: data.finishedProductName || data.productName || "",
    bagSize: data.bagSize || "",
  };
};

const normalizeRawMaterials = (rawMaterials) =>
  Array.isArray(rawMaterials)
    ? rawMaterials.map((item) => ({
      rawMaterialName: item.rawMaterialName || "",
      packagingType: item.packagingType || "",
      level2: item.level2 || "",
      level3: item.level3 || "",
      level4: item.level4 || "",
      packagingBagColor: item.packagingBagColor || item.bagColor || "",
      bucketSize: item.bucketSize || "",
      bagColor: item.bagColor || item.packagingBagColor || "",
      sandEpoxyColor: item.sandEpoxyColor || item.colorOfSandEpoxy || "",
      colorOfSandEpoxy: item.colorOfSandEpoxy || item.sandEpoxyColor || "",
      materialQuantity: parseNumber(item.materialQuantity),
      materialUnit: item.materialUnit || item.unit || "kg",
    }))
    : [];

const normalizeManufacturingData = (data, fallbackRawMaterials) => ({
  productionDate: data.productionDate || "",
  tphBatch: data.tphBatch || "",
  batchNo: data.batchNo || "",

  productCategory: data.productCategory || "",
  materialQuantity: data.materialQuantity || "",
  materialUnit: data.materialUnit || "",

  color: data.color || "",
  finishedProductName: data.finishedProductName || data.productName || "",

  productItems: Array.isArray(data.productItems)
    ? normalizeProductItems(data.productItems)
    : [],

  sticker: data.sticker || "",
  sponge: data.sponge || "",
  wastageQty: parseNumber(data.wastageQty),
  remarks: data.remarks || "",

  rawMaterials: Array.isArray(data.rawMaterials)
    ? normalizeRawMaterials(data.rawMaterials)
    : fallbackRawMaterials ?? [],
});

const buildRawMaterialLabel = (item) =>
  [
    item.rawMaterialName,
    item.packagingType,
    item.level2,
    item.level3,
    item.level4 || item.bucketSize,
    item.packagingBagColor,
    item.sandEpoxyColor || item.colorOfSandEpoxy,
  ]
    .filter(Boolean)
    .join(" / ");

const groupRawMaterialsByInventory = (rawMaterials) => {
  const groupedItems = new Map();

  rawMaterials.forEach((item) => {
    const filter = buildRawMaterialFilter(item);
    const key = JSON.stringify(filter);
    const current = groupedItems.get(key);

    groupedItems.set(key, {
      filter,
      label: current?.label || buildRawMaterialLabel(item),
      materialUnit: current?.materialUnit || item.materialUnit,
      quantity: (current?.quantity || 0) + parseNumber(item.materialQuantity),
    });
  });

  return Array.from(groupedItems.values());
};

const hasValidCoupon = (token) => {
  const value = String(token || "").trim().toLowerCase();
  return Boolean(value) && value !== "n/a" && value !== "non-coupon" && value !== "non-coupan";
};

const buildPackagingItems = (data) => {
  const items = [];

  const productItems = Array.isArray(data.productItems)
    ? data.productItems
    : [];

  productItems.forEach((productItem) => {
    const qty = parseNumber(productItem.totalBagsProduced);

    if (qty <= 0) return;

    if (data.productCategory === "Tile Adhesive" && productItem.bagSize) {
      items.push({
        rawMaterialName: "Packaging",
        packagingType: "FG",
        level2: data.productCategory || "",
        level3: productItem.bagSize,
        level4: data.finishedProductName || "",
        bagColor: data.color || "",
        materialQuantity: qty,
        materialUnit: "bags",
      });
    }

    if (hasValidCoupon(productItem.token)) {
      items.push({
        rawMaterialName: "Packaging",
        packagingType: "FG",
        level2: data.productCategory || "",
        level3: productItem.token,
        level4: data.finishedProductName || "",
        bagColor: data.color || "",
        materialQuantity: qty,
        materialUnit: "pcs",
      });
    }

    if (data.productCategory === "Epoxy") {
      items.push({
        rawMaterialName: "Packaging",
        packagingType: "FG",
        level2: "Epoxy",
        level3: "Sponge",
        materialQuantity: qty,
        materialUnit: "pcs",
      });

      items.push({
        rawMaterialName: "Packaging",
        packagingType: "FG",
        level2: "Epoxy",
        level3: "Sticker",
        materialQuantity: qty,
        materialUnit: "pcs",
      });
    }

    if (data.productCategory === "Tile Cleaner") {
      items.push({
        rawMaterialName: "Packaging",
        packagingType: "FG",
        level2: "Tile Cleaner",
        level3: "Bucket",
        level4: productItem.bagSize,
        materialQuantity: qty,
        materialUnit: "pcs",
      });

      items.push({
        rawMaterialName: "Packaging",
        packagingType: "FG",
        level2: "Tile Cleaner",
        level3: "Seal",
        level4: productItem.bagSize,
        materialQuantity: qty,
        materialUnit: "pcs",
      });

      items.push({
        rawMaterialName: "Packaging",
        packagingType: "FG",
        level2: "Tile Cleaner",
        level3: "Sticker",
        level4: productItem.bagSize,
        materialQuantity: qty,
        materialUnit: "pcs",
      });
    }

    if (data.productCategory === "Bondure") {
      items.push({
        rawMaterialName: "Packaging",
        packagingType: "FG",
        level2: "Bondure",
        level3: productItem.bagSize,
        level4: "Bondure",
        materialQuantity: qty,
        materialUnit: "bags",
      });
    }

    if (data.productCategory === "Grout") {
      items.push({
        rawMaterialName: "Packaging",
        packagingType: "FG",
        level2: "Tile Grout",
        level3: "Pouch 1KG",
        level4: "",
        materialQuantity: qty,
        materialUnit: "nos",
      });
    }
  });

  return items;
};

const reduceRawMaterialStock = async (rawMaterials) => {
  const groupedItems = groupRawMaterialsByInventory(rawMaterials);

  for (const item of groupedItems) {
    const inventory = await Inventory.findOne(item.filter);

    if (!inventory) {
      throw new Error(`${item.label} stock is not available in inventory.`);
    }

    const currentStock = parseNumber(inventory.currentStock);

    if (currentStock < item.quantity) {
      throw new Error(
        `${item.label} has only ${currentStock} ${inventory.unit || item.materialUnit || "stock"} available, but ${item.quantity} ${item.materialUnit || inventory.unit || "stock"} is required.`
      );
    }
  }

  for (const item of groupedItems) {
    await Inventory.updateOne(item.filter, {
      $inc: {
        usedInProduction: item.quantity,
        currentStock: -item.quantity,
      },
    });
  }
};

const addRawMaterialStockBack = async (rawMaterials) => {
  const groupedItems = groupRawMaterialsByInventory(rawMaterials);

  for (const item of groupedItems) {
    const inventory = await Inventory.findOne(item.filter);

    if (!inventory) {
      continue;
    }

    const usedInProduction = parseNumber(inventory.usedInProduction);
    const quantityToRestore = Math.min(usedInProduction, item.quantity);

    await Inventory.updateOne(item.filter, {
      $inc: {
        usedInProduction: -quantityToRestore,
        currentStock: item.quantity,
      },
    });
  }
};

const getManufacturingEntries = async (_req, res) => {
  try {
    const entries = await ManufacturingEntry.find().sort({ createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const buildProductMaterialLabel = (data) =>
  [
    data.productCategory,
    data.token,
    data.color,
    data.finishedProductName || data.productName,
    data.bagSize,
  ]
    .filter(Boolean)
    .join(" / ");

const groupProductMaterialDeltas = (data, direction = 1) => {
  const groupedItems = new Map();
  const productItems = Array.isArray(data?.productItems) ? data.productItems : [];

  productItems.forEach((item) => {
    const quantity = parseNumber(item.totalBagsProduced) * direction;

    if (!quantity) {
      return;
    }

    const payload = {
      productCategory: data.productCategory || "",
      color: data.color || "",
      finishedProductName: data.finishedProductName || data.productName || "",
      token: item.token || "",
      bagSize: item.bagSize || "",
    };
    const filter = buildProductMaterialFilter(payload);
    const key = JSON.stringify(filter);
    const current = groupedItems.get(key);

    groupedItems.set(key, {
      filter,
      label: current?.label || buildProductMaterialLabel(payload),
      quantity: (current?.quantity || 0) + quantity,
    });
  });

  return groupedItems;
};

const combineProductMaterialDeltas = (previousData, nextData) => {
  const combined = new Map();
  const mergeGroup = (group) => {
    group.forEach((value, key) => {
      const current = combined.get(key);

      combined.set(key, {
        filter: value.filter,
        label: current?.label || value.label,
        quantity: (current?.quantity || 0) + value.quantity,
      });
    });
  };

  if (previousData) {
    mergeGroup(groupProductMaterialDeltas(previousData, -1));
  }

  if (nextData) {
    mergeGroup(groupProductMaterialDeltas(nextData, 1));
  }

  return Array.from(combined.values()).filter((item) => item.quantity !== 0);
};

const applyProductMaterialLogDeltas = async (previousData, nextData) => {
  const deltas = combineProductMaterialDeltas(previousData, nextData);

  for (const item of deltas) {
    const productStock = await ProductMaterialLog.findOne(item.filter);

    if (item.quantity < 0) {
      if (!productStock) {
        throw new Error(`${item.label} stock is not available in product material log.`);
      }

      const currentQuantity = parseNumber(productStock.currentQuantity);
      const requiredReduction = Math.abs(item.quantity);

      if (currentQuantity < requiredReduction) {
        throw new Error(
          `${item.label} has only ${currentQuantity} quantity available in product material log, but ${requiredReduction} needs to be reduced.`
        );
      }
    }
  }

  for (const item of deltas) {
    let productStock = await ProductMaterialLog.findOne(item.filter);

    if (!productStock) {
      productStock = await ProductMaterialLog.create({
        ...item.filter,
        currentQuantity: Math.max(0, item.quantity),
        shippedQuantity: 0,
      });

      continue;
    }

    productStock.currentQuantity = parseNumber(productStock.currentQuantity) + item.quantity;
    await productStock.save();
  }
};

const updateWastageStock = async (data) => {
  const wastageQty = Number(data.wastageQty || 0);

  if (wastageQty <= 0) {
    return null;
  }

  const tphBatch = String(data.tphBatch || "").trim();
  const productCategory = String(data.productCategory || "").trim();
  const finishedProductName = String(data.finishedProductName || "").trim();

  if (!tphBatch || !finishedProductName) {
    throw new Error("TPH Batch and Finished Product Name are required for wastage stock.");
  }

  const filter = {
    tphBatch,
    finishedProductName,
  };

  return await Wastage.findOneAndUpdate(
    filter,
    {
      $setOnInsert: {
        date: data.productionDate || data.date || "",
        tphBatch,
        productCategory,
        finishedProductName,
      },
      $inc: {
        wastageQty,
      },
    },
    {
      new: true,
      upsert: true,
    }
  );
};

const createManufacturingEntry = async (req, res) => {
  try {
    const data = normalizeManufacturingData(req.body);

    const inventoryItemsToReduce = [
      ...data.rawMaterials,
      ...buildPackagingItems(data),
    ];

    await reduceRawMaterialStock(inventoryItemsToReduce);

    const entry = await ManufacturingEntry.create(data);

    await applyProductMaterialLogDeltas(null, data);

    const productionWastageQty = Number(data.wastageQty || 0);
    const packedWastageQty = Number(data.packedWastage || 0);

    // Add only new production wastage
    if (productionWastageQty > 0) {
      await updateWastageStock(data);
    }

    res.status(201).json({
      success: true,
      message: "Production entry created successfully",
      data: entry,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateManufacturingEntry = async (req, res) => {
  try {
    const current = await ManufacturingEntry.findById(req.params.id);

    if (!current) {
      return res.status(404).json({ success: false, message: "Production entry not found" });
    }

    const hasRawMaterialUpdates = Array.isArray(req.body.rawMaterials);
    const data = normalizeManufacturingData(req.body, current.rawMaterials || []);

    if (hasRawMaterialUpdates) {
      await addRawMaterialStockBack(current.rawMaterials || []);
      await reduceRawMaterialStock(data.rawMaterials);
    }

    await applyProductMaterialLogDeltas(current, data);

    const updated = await ManufacturingEntry.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    res.json({ success: true, message: "Production entry updated successfully", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteManufacturingEntry = async (req, res) => {
  try {
    const current = await ManufacturingEntry.findById(req.params.id);

    if (!current) {
      return res.status(404).json({ success: false, message: "Production entry not found" });
    }

    await addRawMaterialStockBack(current.rawMaterials || []);
    await applyProductMaterialLogDeltas(current, null);
    await ManufacturingEntry.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Production entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductionMaterialLogs = async (_req, res) => {
  try {
    const logs = await ProductMaterialLog.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: logs.map((log) => ({
        id: log._id,
        productCategory: log.productCategory || "",
        productColor: log.color || "",
        productName: log.productName || "",
        token: log.token || "",
        bagSize: log.bagSize || "",
        currentQuantity: log.currentQuantity || 0,
        shippedQuantity: log.shippedQuantity || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getManufacturingEntries,
  createManufacturingEntry,
  updateManufacturingEntry,
  deleteManufacturingEntry,
  getProductionMaterialLogs,
};