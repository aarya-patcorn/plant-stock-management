const ManufacturingEntry = require("../model/ManufacturingEntry");
const Inventory = require("../model/Inventory");
const DispatchEntry = require("../model/DispatchEntry");
const ProductMaterialLog = require("../model/ProductMaterialLog");
const Wastage = require("../model/Wastage");

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const TILE_CLEANER_FORMULAS = {
  ShineX: {
    "Urea (Technical Grade)": 3,
    "2-Butoxyethanol": 2,
    "Sulphamic Acid": 3.5,
    "Citric Acid": 2,
    "Hydrochloric Acid (32%)": 3,
    "Alphox-200": 2,
    "Cocamidopropyl Betaine": 3.5,
    "Xanthan Gum": 0.3,
    "Fragrance & Dye": 0.2,
  },
  CrystalX: {
    "Alcohol Ethoxylate": 6,
    "Sodium Gluconate": 2.5,
    "2-Butoxyethanol": 2.5,
    "Isopropyl Alcohol (IPA 99%)": 1,
    "Benzalkonium Chloride (BKC)": 0.9,
    "Fragrance & Dye": 0.4,
  },
};

const convertQuantityToInventoryUnit = (quantity, fromUnit, toUnit) => {
  const qty = Number(quantity) || 0;
  const from = String(fromUnit || "").toLowerCase();
  const to = String(toUnit || "").toLowerCase();

  if (from === to) return qty;

  if (from === "gm" && to === "kg") return qty / 1000;
  if (from === "g" && to === "kg") return qty / 1000;
  if (from === "kg" && (to === "gm" || to === "g")) return qty * 1000;

  if (from === "mt" && to === "kg") return qty * 1000;
  if (from === "kg" && to === "mt") return qty / 1000;
  if ((from === "ltr" || from === "l") && to === "ml") return qty * 1000;
  if (from === "ml" && (to === "ltr" || to === "l")) return qty / 1000;

  return qty;
};

const isKgInventoryMlMaterial = (inventoryUnit, materialUnit) =>
  String(inventoryUnit || "").toLowerCase() === "kg" &&
  String(materialUnit || "").toLowerCase() === "ml";

const getRawMaterialQuantityInInventoryUnit = (item, inventory) => {
  const materialQuantity = parseNumber(item.quantity);

  if (isKgInventoryMlMaterial(inventory.unit, item.materialUnit)) {
    return materialQuantity / 1000;
  }

  return convertQuantityToInventoryUnit(
    materialQuantity,
    item.materialUnit,
    inventory.unit,
  );
};

const compactFilter = (fields) =>
  Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
  );

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const normalizeTileCleanerProductName = (value) => {
  const normalized = normalizeText(value).replace(/\s+/g, "");

  if (normalized.startsWith("shinex")) return "ShineX";
  if (normalized.startsWith("crystalx")) return "CrystalX";

  return "";
};

const parseTileCleanerCanSizeToLiters = (value) => {
  const match = String(value || "").match(/(\d+(?:\.\d+)?)/);
  const liters = match ? Number(match[1]) : 0;
  return Number.isFinite(liters) ? liters : 0;
};

const buildTileCleanerRawMaterials = (productName, canSize, totalCan) => {
  const normalizedProductName = normalizeTileCleanerProductName(productName);
  const formula = normalizedProductName ? TILE_CLEANER_FORMULAS[normalizedProductName] : null;
  const litersPerCan = parseTileCleanerCanSizeToLiters(canSize);
  const totalCanCount = parseNumber(totalCan);
  const totalLiquidML = litersPerCan * totalCanCount * 1000;

  if (!formula || !litersPerCan || totalCanCount <= 0 || totalLiquidML <= 0) {
    return [];
  }

  return Object.entries(formula).map(([chemicalName, percentage]) => ({
    rawMaterialName: "Chemical",
    packagingType: "Tile Cleaner",
    level2: chemicalName,
    level3: "",
    level4: "",
    packagingBagColor: "",
    bucketSize: "",
    bagColor: "",
    sandEpoxyColor: "",
    colorOfSandEpoxy: "",
    materialQuantity: (totalLiquidML * percentage) / 100,
    materialUnit: "ml",
  }));
};

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
  user: data.user || "",
  tphBatch: data.tphBatch || "",
  batchNo: data.batchNo || "",

  productCategory: data.productCategory || "",
  materialQuantity: data.materialQuantity || "",
  materialUnit: data.materialUnit || "",

  color: data.color || "",
  finishedProductName: (() => {
    const productCategory = String(data.productCategory || "").trim();
    const rawProductName = data.finishedProductName || data.productName || "";
    return productCategory === "Tile Cleaner"
      ? normalizeTileCleanerProductName(rawProductName) || String(rawProductName || "").trim()
      : rawProductName;
  })(),
  canSize: (() => {
    const productCategory = String(data.productCategory || "").trim();
    const rawProductName = String(data.finishedProductName || data.productName || "");
    const derivedCanSize =
      String(data.canSize || data.bagSize || "").trim() ||
      (rawProductName.includes("1L") ? "1L" : rawProductName.includes("5L") ? "5L" : "");
    return productCategory === "Tile Cleaner" ? derivedCanSize : "";
  })(),
  totalCan: (() => {
    const productCategory = String(data.productCategory || "").trim();
    return productCategory === "Tile Cleaner"
      ? String(data.totalCan ?? data.totalBagsProduced ?? "")
      : "";
  })(),

  productItems: (() => {
    const normalizedItems = Array.isArray(data.productItems)
      ? normalizeProductItems(data.productItems)
      : [];

    if (String(data.productCategory || "").trim() !== "Tile Cleaner") {
      return normalizedItems;
    }

    const canSize = String(data.canSize || data.bagSize || normalizedItems[0]?.bagSize || "").trim();
    const totalCan = parseNumber(data.totalCan ?? data.totalBagsProduced ?? normalizedItems[0]?.totalBagsProduced);

    if (canSize && totalCan > 0) {
      return [{
        token: "N/A",
        bagSize: canSize,
        totalBagsProduced: totalCan,
      }];
    }

    return normalizedItems;
  })(),

  sticker: data.sticker || "",
  sponge: data.sponge || "",
  wastageQty: parseNumber(data.wastageQty),
  remarks: data.remarks || "",

  rawMaterials: (() => {
    const productCategory = String(data.productCategory || "").trim();

    if (productCategory === "Tile Cleaner") {
      const productName = normalizeTileCleanerProductName(data.finishedProductName || data.productName || "");
      const canSize = String(data.canSize || data.bagSize || "").trim();
      const totalCan = data.totalCan ?? data.totalBagsProduced ?? 0;
      return buildTileCleanerRawMaterials(productName, canSize, totalCan);
    }

    return Array.isArray(data.rawMaterials)
      ? normalizeRawMaterials(data.rawMaterials)
      : fallbackRawMaterials ?? [];
  })(),
});

const getProductionMonthRange = (productionDateValue) => {
  const productionDate = new Date(productionDateValue);

  if (Number.isNaN(productionDate.getTime())) {
    return null;
  }

  const monthStart = new Date(
    productionDate.getFullYear(),
    productionDate.getMonth(),
    1,
  );

  const monthEnd = new Date(
    productionDate.getFullYear(),
    productionDate.getMonth() + 1,
    1,
  );

  return {
    monthStart: monthStart.toISOString().slice(0, 10),
    monthEnd: monthEnd.toISOString().slice(0, 10),
  };
};

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getUniqueProductBagSizes = (productItems = []) =>
  Array.from(
    new Set(
      (Array.isArray(productItems) ? productItems : [])
        .map((item) => String(item?.bagSize || "").trim())
        .filter(Boolean),
    ),
  );

const findExistingBatchForMonth = async (data, trimmedBatchNo, excludedId) => {
  const productionMonthRange = getProductionMonthRange(data.productionDate);

  if (!productionMonthRange) {
    return {
      error: "Production date is invalid.",
    };
  }

  const bagSizes = getUniqueProductBagSizes(data.productItems);
  const finishedProductName = String(
    data.finishedProductName || data.productName || "",
  ).trim();
  const color = String(data.color || "").trim();

  for (const bagSize of bagSizes) {
    const existingBatch = await ManufacturingEntry.findOne({
      ...(excludedId ? { _id: { $ne: excludedId } } : {}),
      batchNo: { $regex: `^${escapeRegex(trimmedBatchNo)}$`, $options: "i" },
      productCategory: data.productCategory || "",
      color,
      productionDate: {
        $gte: productionMonthRange.monthStart,
        $lt: productionMonthRange.monthEnd,
      },
      $or: [
        { finishedProductName },
        { productName: finishedProductName },
      ],
      productItems: {
        $elemMatch: {
          bagSize,
        },
      },
    });

    if (existingBatch) {
      return {
        error: `Batch No. ${trimmedBatchNo} already exists for ${data.productCategory} / ${finishedProductName} / ${color} / ${bagSize} in this month.`,
      };
    }
  }

  return null;
};

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

const isGroutProductCategory = (productCategory) => {
  const value = String(productCategory || "").trim().toLowerCase();
  return value === "grout" || value === "tile grout";
};

const isEpoxyProductCategory = (productCategory) =>
  String(productCategory || "").trim().toLowerCase() === "epoxy";

const normalizeBondureBagSize = (value = "") => {
  const number = String(value).match(/\d+(\.\d+)?/)?.[0] || "";
  return number ? `${number} KG` : String(value).trim();
};

const normalizeBucketSize = (value = "") => {
  const normalized = String(value || "")
    .replace(/^bucket\s+/i, "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();

  if (normalized === "1KG") return "1KG";
  if (normalized === "5KG") return "5KG";

  return normalized;
};

const getChemicalHardnerGramPerBucket = (bucketSize) => {
  const size = normalizeBucketSize(bucketSize);
  if (size === "1KG") return 112;
  if (size === "5KG") return 385;
  return 0;
};

const getPackagingCategoryLevel2 = (productCategory) =>
  isGroutProductCategory(productCategory)
    ? "Tile Grout"
    : String(productCategory || "").trim();

const logPackagingInventoryLookup = (stage, item, filter, inventory) => {
  console.log(`[Packaging:${stage}] filter:`, filter);
  console.log(
    `[Packaging:${stage}] inventory:`,
    inventory
      ? {
        id: inventory._id,
        rawMaterialName: inventory.rawMaterialName,
        packagingType: inventory.packagingType,
        level2: inventory.level2,
        level3: inventory.level3,
        level4: inventory.level4,
        packagingBagColor: inventory.packagingBagColor,
        coupon: inventory.coupon,
        unit: inventory.unit,
        currentStock: inventory.currentStock,
        usedInProduction: inventory.usedInProduction,
      }
      : null,
  );
  console.log(
    `[Packaging:${stage}] currentStock:`,
    inventory ? parseNumber(inventory.currentStock) : null,
    "requiredQty:",
    parseNumber(item?.quantity),
  );
};

const findPackagingInventory = async (item, stage) => {
  const inventory = await Inventory.findOne(item.filter);
  logPackagingInventoryLookup(stage, item, item.filter, inventory);
  if (item.packagingItemType === "bondure-bag") {
    console.log("[Bondure Packaging Filter]", item.filter);
    console.log("[Bondure Packaging Inventory]", inventory);
  }
  return inventory;
};

const buildPackagingInventoryFilter = (fields) => {
  if (fields.packagingItemType === "grout-pouch") {
    return compactFilter({
      rawMaterialName: "Packaging",
      packagingType: "FG",
      level2: "Tile Grout",
      level3: fields.level3 || "",
      unit: fields.unit || "nos",
    });
  }

  if (fields.packagingItemType === "bondure-bag") {
    return compactFilter({
      rawMaterialName: "Packaging",
      packagingType: "FG",
      level2: "Bondure",
      level3: normalizeBondureBagSize(fields.level3 || ""),
      level4: "Bondure",
      unit: fields.unit || "bags",
    });
  }

  if (fields.packagingItemType === "epoxy-bucket") {
    return compactFilter({
      rawMaterialName: "Packaging",
      packagingType: "FG",
      level2: "Epoxy",
      level3: `Bucket ${normalizeBucketSize(fields.bucketSize || fields.level3 || "")}`.trim(),
      unit: fields.unit || "nos",
    });
  }

  if (fields.packagingItemType === "tile-cleaner-can") {
    return compactFilter({
      rawMaterialName: "Packaging",
      packagingType: "FG",
      level2: "Tile Cleaner",
      level3: "Can",
      bucketSize: fields.bucketSize || "",
      unit: fields.unit || "pcs",
    });
  }

  const isCoupon = fields.unit === "pcs" && fields.coupon;

  return compactFilter({
    rawMaterialName: "Packaging",
    packagingType: "FG",
    level2: fields.level2 || "",
    level3: fields.level3 || "",
    level4: fields.level4 || "",
    packagingBagColor: isCoupon ? "" : fields.packagingBagColor || "",
    coupon: fields.coupon || "",
    unit: fields.unit || "",
  });
};

const buildPackagingInventoryLabel = (fields) =>
  [
    fields.rawMaterialName || "Packaging",
    fields.packagingType || "FG",
    fields.level2,
    fields.level3,
    fields.level4,
    fields.bucketSize,
    fields.packagingBagColor,
    fields.unit,
  ]
    .filter(Boolean)
    .join(" / ");

const buildChemicalHardnerInventoryFilter = () =>
  ({
    rawMaterialName: "Chemical",
    packagingType: "Epoxy",
    level2: "Hardner",
    unit: "kg",
  });

const buildChemicalHardnerLabel = () => "Chemical / Epoxy / Hardner / kg";

const buildPackagingItems = (data) => {
  const items = [];

  const productItems = Array.isArray(data.productItems)
    ? data.productItems
    : [];

  productItems.forEach((productItem) => {
    const qty = parseNumber(productItem.totalBagsProduced);

    if (qty <= 0) return;

    const tokenValue = String(productItem.token || "").trim().toLowerCase();
    const isCoupon =
      tokenValue === "coupon" ||
      tokenValue === "coupan";
    const isNonCoupon =
      tokenValue === "non-coupon" ||
      tokenValue === "non-coupan";
    const actualToken = String(
      data.finishedProductName || data.productName || "",
    ).trim();

    if (isGroutProductCategory(data.productCategory) && productItem.bagSize) {
      items.push({
        packagingItemType: "grout-pouch",
        level2: getPackagingCategoryLevel2(data.productCategory),
        level3: productItem.bagSize,
        quantity: qty,
        unit: "nos",
        errorNotFound: "Packaging bag inventory not found",
        errorInsufficient: "Insufficient packaging bag stock",
      });
    } else if (String(data.productCategory || "").trim() === "Bondure" && productItem.bagSize) {
      items.push({
        packagingItemType: "bondure-bag",
        level2: "Bondure",
        level3: productItem.bagSize,
        quantity: qty,
        unit: "bags",
        errorNotFound: "Packaging bag inventory not found",
        errorInsufficient: "Insufficient packaging bag stock",
      });
    } else if (isEpoxyProductCategory(data.productCategory) && productItem.bagSize) {
      items.push({
        packagingItemType: "epoxy-bucket",
        level2: "Epoxy",
        level3: normalizeBucketSize(productItem.bagSize),
        quantity: qty,
        unit: "nos",
        errorNotFound: "Packaging bucket inventory not found",
        errorInsufficient: "Insufficient packaging bucket stock",
      });
    } else if (String(data.productCategory || "").trim() === "Tile Cleaner" && productItem.bagSize) {
      items.push({
        packagingItemType: "tile-cleaner-can",
        level2: "Tile Cleaner",
        level3: "Can",
        bucketSize: productItem.bagSize,
        quantity: qty,
        unit: "pcs",
        errorNotFound: "Tile Cleaner can inventory not found",
        errorInsufficient: "Insufficient Tile Cleaner can stock",
      });
      items.push({
        level2: "Tile Cleaner",
        level3: "Sticker",
        quantity: qty,
        unit: "pcs",
        errorNotFound: "Tile Cleaner sticker inventory not found",
        errorInsufficient: "Insufficient Tile Cleaner sticker stock",
      });
      items.push({
        level2: "Tile Cleaner",
        level3: "Seal",
        quantity: qty,
        unit: "pcs",
        errorNotFound: "Tile Cleaner seal inventory not found",
        errorInsufficient: "Insufficient Tile Cleaner seal stock",
      });
    } else if (actualToken && productItem.bagSize) {
      items.push({
        level2: data.productCategory || "",
        level3: productItem.bagSize,
        level4: actualToken,
        packagingBagColor: data.color || "Grey",
        quantity: qty,
        unit: "bags",
        errorNotFound: "Packaging bag inventory not found",
        errorInsufficient: "Insufficient packaging bag stock",
      });

      if (isCoupon && !isNonCoupon) {
        items.push({
          level2: data.productCategory || "",
          level3: productItem.bagSize,
          level4: actualToken,
          packagingBagColor: data.color || data.productColor || "",
          token: "Coupon",
          quantity: qty,
          unit: "pcs",
          errorNotFound: `Coupon inventory not found for ${data.productCategory} / ${productItem.bagSize} / ${actualToken}`,
          errorInsufficient: "Insufficient coupon stock",
        });
      }
    }

    if (isGroutProductCategory(data.productCategory)) {
      const cartonQty = Math.ceil(qty / 25);

      if (cartonQty > 0) {
        items.push({
          level2: "Tile Grout",
          level3: "Carton",
          quantity: cartonQty,
          unit: "nos",
          errorNotFound: "Carton inventory not found",
          errorInsufficient: "Insufficient carton stock",
        });
      }
    }

    if (isEpoxyProductCategory(data.productCategory)) {
      const bucketSize = String(productItem.bagSize || "").trim().toLowerCase();
      const hardnerName =
        bucketSize === "1kg"
          ? "Hardner 112gm"
          : bucketSize === "5kg"
            ? "Hardner 385gm"
            : "";

      if (hardnerName) {
        items.push({
          rawMaterialName: "Packaging",
          packagingType: "FG",
          level2: "Epoxy",
          level3: hardnerName,
          quantity: qty,
          unit: "nos",
          errorNotFound: "Hardner inventory not found",
          errorInsufficient: "Insufficient hardner stock",
        });
      }
    }
  });

  if (isEpoxyProductCategory(data.productCategory)) {
    const stickerQty = parseNumber(data.sticker);
    const spongeQty = parseNumber(data.sponge);

    if (stickerQty > 0) {
      items.push({
        level2: "Epoxy",
        level3: "Sticker",
        quantity: stickerQty,
        unit: "nos",
        errorNotFound: "Sticker inventory not found",
        errorInsufficient: "Insufficient sticker stock",
      });
    }

    if (spongeQty > 0) {
      items.push({
        level2: "Epoxy",
        level3: "Sponge",
        quantity: spongeQty,
        unit: "nos",
        errorNotFound: "Sponge inventory not found",
        errorInsufficient: "Insufficient sponge stock",
      });
    }
  }

  return items;
};

const buildChemicalHardnerItems = (data) => {
  if (!isEpoxyProductCategory(data.productCategory)) {
    return [];
  }

  const items = [];
  const productItems = Array.isArray(data.productItems)
    ? data.productItems
    : [];

  productItems.forEach((productItem) => {
    const totalBagsProduced = parseNumber(productItem.totalBagsProduced);
    const bucketSize = productItem.bagSize || "";
    const hardnerGramPerBucket = getChemicalHardnerGramPerBucket(bucketSize);

    if (totalBagsProduced <= 0 || hardnerGramPerBucket <= 0) {
      return;
    }

    const chemicalHardnerQtyKg = (hardnerGramPerBucket * totalBagsProduced) / 1000;

    console.log("[Epoxy Chemical Hardner] bucketSize:", bucketSize);
    console.log("[Epoxy Chemical Hardner] totalBags:", totalBagsProduced);
    console.log("[Epoxy Chemical Hardner] qtyKg:", chemicalHardnerQtyKg);

    items.push({
      filter: buildChemicalHardnerInventoryFilter(),
      label: buildChemicalHardnerLabel(),
      quantity: chemicalHardnerQtyKg,
      errorNotFound: "Chemical Hardner inventory not found",
      errorInsufficient: "Insufficient Chemical Hardner stock",
    });
  });

  return items;
};

const groupChemicalHardnerItemsByInventory = (items) => {
  const groupedItems = new Map();

  items.forEach((item) => {
    const key = JSON.stringify(item.filter);
    const current = groupedItems.get(key);

    groupedItems.set(key, {
      filter: item.filter,
      label: current?.label || item.label,
      quantity: (current?.quantity || 0) + parseNumber(item.quantity),
      errorNotFound: item.errorNotFound,
      errorInsufficient: item.errorInsufficient,
    });
  });

  return Array.from(groupedItems.values());
};

const groupPackagingItemsByInventory = (packagingItems) => {
  const groupedItems = new Map();

  packagingItems.forEach((item) => {
    const filter = buildPackagingInventoryFilter(item);
    const key = JSON.stringify(filter);
    const current = groupedItems.get(key);

    groupedItems.set(key, {
      filter,
      label: current?.label || buildPackagingInventoryLabel({
        rawMaterialName: "Packaging",
        packagingType: "FG",
        ...item,
      }),
      unit: current?.unit || item.unit,
      quantity: (current?.quantity || 0) + parseNumber(item.quantity),
      errorNotFound: item.errorNotFound,
      errorInsufficient: item.errorInsufficient,
    });
  });

  return Array.from(groupedItems.values());
};

const buildChemicalHardnerDeltaMap = (data, direction = 1) => {
  const deltas = new Map();
  const groupedItems = groupChemicalHardnerItemsByInventory(buildChemicalHardnerItems(data));

  groupedItems.forEach((item) => {
    const key = JSON.stringify(item.filter);
    deltas.set(key, {
      ...item,
      quantity: item.quantity * direction,
    });
  });

  return deltas;
};

const buildPackagingDeltaMap = (data, direction = 1) => {
  const deltas = new Map();
  const groupedItems = groupPackagingItemsByInventory(buildPackagingItems(data));

  groupedItems.forEach((item) => {
    const key = JSON.stringify(item.filter);
    deltas.set(key, {
      ...item,
      quantity: item.quantity * direction,
    });
  });

  return deltas;
};

const combinePackagingDeltas = (previousData, nextData) => {
  const combined = new Map();
  const mergeDeltas = (deltas) => {
    deltas.forEach((value, key) => {
      const current = combined.get(key);

      combined.set(key, {
        ...value,
        label: current?.label || value.label,
        quantity: (current?.quantity || 0) + value.quantity,
      });
    });
  };

  if (previousData) {
    mergeDeltas(buildPackagingDeltaMap(previousData, -1));
  }

  if (nextData) {
    mergeDeltas(buildPackagingDeltaMap(nextData, 1));
  }

  return Array.from(combined.values()).filter((item) => item.quantity !== 0);
};

const combineChemicalHardnerDeltas = (previousData, nextData) => {
  const combined = new Map();
  const mergeDeltas = (deltas) => {
    deltas.forEach((value, key) => {
      const current = combined.get(key);

      combined.set(key, {
        ...value,
        label: current?.label || value.label,
        quantity: (current?.quantity || 0) + value.quantity,
      });
    });
  };

  if (previousData) {
    mergeDeltas(buildChemicalHardnerDeltaMap(previousData, -1));
  }

  if (nextData) {
    mergeDeltas(buildChemicalHardnerDeltaMap(nextData, 1));
  }

  return Array.from(combined.values()).filter((item) => item.quantity !== 0);
};

const validatePackagingStockChange = async (previousData, nextData) => {
  const deltas = combinePackagingDeltas(previousData, nextData);

  for (const item of deltas) {
    if (item.quantity <= 0) {
      continue;
    }

    const inventory = await findPackagingInventory(item, "validate");

    if (!inventory) {
      throw new Error(item.errorNotFound || `${item.label} stock is not available in inventory.`);
    }

    const currentStock = parseNumber(inventory.currentStock);

    if (currentStock < item.quantity) {
      throw new Error(item.errorInsufficient || `${item.label} does not have enough stock.`);
    }
  }
};

const validateChemicalHardnerStockChange = async (previousData, nextData) => {
  const deltas = combineChemicalHardnerDeltas(previousData, nextData);

  for (const item of deltas) {
    if (item.quantity <= 0) {
      continue;
    }

    const inventory = await Inventory.findOne(item.filter);

    if (!inventory) {
      throw new Error(item.errorNotFound || `${item.label} stock is not available in inventory.`);
    }

    const currentStock = parseNumber(inventory.currentStock);

    if (currentStock < item.quantity) {
      throw new Error(item.errorInsufficient || `${item.label} does not have enough stock.`);
    }
  }
};

const reducePackagingStock = async (data) => {
  const groupedItems = groupPackagingItemsByInventory(buildPackagingItems(data));

  for (const item of groupedItems) {
    const inventory = await findPackagingInventory(item, "reduce:validate");

    if (!inventory) {
      throw new Error(item.errorNotFound || `${item.label} stock is not available in inventory.`);
    }

    const currentStock = parseNumber(inventory.currentStock);

    if (currentStock < item.quantity) {
      throw new Error(item.errorInsufficient || `${item.label} does not have enough stock.`);
    }
  }

  for (const item of groupedItems) {
    const inventory = await findPackagingInventory(item, "reduce:update");

    if (!inventory) {
      throw new Error(item.errorNotFound || `${item.label} stock is not available in inventory.`);
    }

    await Inventory.updateOne(item.filter, {
      $inc: {
        usedInProduction: item.quantity,
        currentStock: -item.quantity,
      },
    });
  }
};

const addPackagingStockBack = async (data) => {
  const groupedItems = groupPackagingItemsByInventory(buildPackagingItems(data));

  for (const item of groupedItems) {
    const inventory = await findPackagingInventory(item, "restore");

    if (!inventory) {
      continue;
    }

    const usedInProduction = parseNumber(inventory.usedInProduction);
    const quantityToRestore = Math.min(usedInProduction, item.quantity);

    await Inventory.updateOne(item.filter, {
      $inc: {
        usedInProduction: -quantityToRestore,
        currentStock: quantityToRestore,
      },
    });
  }
};

const reduceChemicalHardnerStock = async (data) => {
  const groupedItems = groupChemicalHardnerItemsByInventory(buildChemicalHardnerItems(data));

  for (const item of groupedItems) {
    const inventory = await Inventory.findOne(item.filter);

    if (!inventory) {
      throw new Error(item.errorNotFound || `${item.label} stock is not available in inventory.`);
    }

    const currentStock = parseNumber(inventory.currentStock);

    if (currentStock < item.quantity) {
      throw new Error(item.errorInsufficient || `${item.label} does not have enough stock.`);
    }
  }

  for (const item of groupedItems) {
    const inventory = await Inventory.findOne(item.filter);

    if (!inventory) {
      throw new Error(item.errorNotFound || `${item.label} stock is not available in inventory.`);
    }

    await Inventory.updateOne(item.filter, {
      $inc: {
        usedInProduction: item.quantity,
        currentStock: -item.quantity,
      },
    });
  }
};

const reduceRawMaterialStock = async (rawMaterials) => {
  const groupedItems = groupRawMaterialsByInventory(rawMaterials);

  for (const item of groupedItems) {
    const inventory = await Inventory.findOne(item.filter);

    if (!inventory) {
      throw new Error(`${item.label} stock is not available in inventory.`);
    }

    const currentStock = parseNumber(inventory.currentStock);
    const isKgInventoryMl = isKgInventoryMlMaterial(inventory.unit, item.materialUnit);
    const requiredQty = getRawMaterialQuantityInInventoryUnit(item, inventory);
    const availableQty = isKgInventoryMl ? currentStock * 1000 : currentStock;
    const requiredDisplayQty = isKgInventoryMl ? parseNumber(item.quantity) : requiredQty;
    const requiredDisplayUnit = isKgInventoryMl ? item.materialUnit : inventory.unit || item.materialUnit || "stock";

    if (availableQty < requiredDisplayQty) {
      throw new Error(
        `${item.label} has only ${availableQty} ${requiredDisplayUnit} available, but ${requiredDisplayQty} ${requiredDisplayUnit} is required.`
      );
    }
  }

  for (const item of groupedItems) {
    const inventory = await Inventory.findOne(item.filter);

    if (!inventory) {
      throw new Error(`${item.label} stock is not available in inventory.`);
    }

    const requiredQty = getRawMaterialQuantityInInventoryUnit(item, inventory);

    if (isKgInventoryMlMaterial(inventory.unit, item.materialUnit)) {
      await Inventory.updateOne(item.filter, {
        $set: {
          currentStock: parseNumber(inventory.currentStock) - requiredQty,
        },
        $inc: {
          usedInProduction: requiredQty,
        },
      });
    } else {
      await Inventory.updateOne(item.filter, {
        $inc: {
          usedInProduction: requiredQty,
          currentStock: -requiredQty,
        },
      });
    }
  }
};

const updatePackagingStock = async (previousData, nextData) => {
  const deltas = combinePackagingDeltas(previousData, nextData);
  await validatePackagingStockChange(previousData, nextData);

  for (const item of deltas) {
    if (item.quantity > 0) {
      const inventory = await findPackagingInventory(item, "update:deduct");

      if (!inventory) {
        throw new Error(item.errorNotFound || `${item.label} stock is not available in inventory.`);
      }

      await Inventory.updateOne(item.filter, {
        $inc: {
          usedInProduction: item.quantity,
          currentStock: -item.quantity,
        },
      });
      continue;
    }

    const inventory = await findPackagingInventory(item, "update:restore");

    if (!inventory) {
      continue;
    }

    const restoreQuantity = Math.abs(item.quantity);
    const usedInProduction = parseNumber(inventory.usedInProduction);
    const quantityToRestore = Math.min(usedInProduction, restoreQuantity);

    await Inventory.updateOne(item.filter, {
      $inc: {
        usedInProduction: -quantityToRestore,
        currentStock: quantityToRestore,
      },
    });
  }
};

const updateChemicalHardnerStock = async (previousData, nextData) => {
  const deltas = combineChemicalHardnerDeltas(previousData, nextData);
  await validateChemicalHardnerStockChange(previousData, nextData);

  for (const item of deltas) {
    if (item.quantity > 0) {
      const inventory = await Inventory.findOne(item.filter);

      if (!inventory) {
        throw new Error(item.errorNotFound || `${item.label} stock is not available in inventory.`);
      }

      await Inventory.updateOne(item.filter, {
        $inc: {
          usedInProduction: item.quantity,
          currentStock: -item.quantity,
        },
      });
      continue;
    }

    const inventory = await Inventory.findOne(item.filter);

    if (!inventory) {
      continue;
    }

    const restoreQuantity = Math.abs(item.quantity);
    const usedInProduction = parseNumber(inventory.usedInProduction);
    const quantityToRestore = Math.min(usedInProduction, restoreQuantity);

    await Inventory.updateOne(item.filter, {
      $inc: {
        usedInProduction: -quantityToRestore,
        currentStock: quantityToRestore,
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

    const restoreQty = getRawMaterialQuantityInInventoryUnit(item, inventory);
    const usedInProduction = parseNumber(inventory.usedInProduction);
    const quantityToRestore = Math.min(usedInProduction, restoreQty);

    await Inventory.updateOne(item.filter, {
      $inc: {
        usedInProduction: -quantityToRestore,
        currentStock: quantityToRestore,
      },
    });
  }
};

const addChemicalHardnerStockBack = async (data) => {
  const groupedItems = groupChemicalHardnerItemsByInventory(buildChemicalHardnerItems(data));

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
        currentStock: quantityToRestore,
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
    console.log("req.body:", req.body);

    const data = normalizeManufacturingData(req.body);

    console.log("Normalized data:", data);

    const trimmedBatchNo = String(data.batchNo || "").trim();

    if (!trimmedBatchNo) {
      return res.status(400).json({
        success: false,
        message: "Batch No. is required.",
      });
    }

    if (!String(data.productionDate || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Production date is required.",
      });
    }

    const duplicateBatchCheck = await findExistingBatchForMonth(
      data,
      trimmedBatchNo,
    );

    if (duplicateBatchCheck?.error) {
      return res.status(400).json({
        success: false,
        message: duplicateBatchCheck.error,
      });
    }

    data.batchNo = trimmedBatchNo;

    await validatePackagingStockChange(null, data);
    await validateChemicalHardnerStockChange(null, data);
    await reduceRawMaterialStock(data.rawMaterials);
    await reducePackagingStock(data);
    await reduceChemicalHardnerStock(data);

    const entry = await ManufacturingEntry.create(data);

    await applyProductMaterialLogDeltas(null, data);

    const productionWastageQty = Number(data.wastageQty || 0);

    if (productionWastageQty > 0) {
      await updateWastageStock(data);
    }

    res.status(201).json({
      success: true,
      message: "Production entry created successfully",
      data: entry,
    });
  } catch (error) {
    console.error(error.stack);

    if (error.code === 11000 && error.keyPattern?.batchNo) {
      return res.status(400).json({
        success: false,
        message: "Batch No. already exists. Please enter a unique Batch No.",
      });
    }

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
    const trimmedBatchNo = String(data.batchNo || "").trim();

    if (!String(data.productionDate || "").trim()) {
      return res.status(400).json({ success: false, message: "Production date is required." });
    }

    if (!trimmedBatchNo) {
      return res.status(400).json({ success: false, message: "Batch No. is required." });
    }

    const duplicateBatchCheck = await findExistingBatchForMonth(
      data,
      trimmedBatchNo,
      req.params.id,
    );

    if (duplicateBatchCheck?.error) {
      return res.status(400).json({ success: false, message: duplicateBatchCheck.error });
    }

    data.batchNo = trimmedBatchNo;

    await validatePackagingStockChange(current, data);
    await validateChemicalHardnerStockChange(current, data);

    if (hasRawMaterialUpdates) {
      await addRawMaterialStockBack(current.rawMaterials || []);
      await reduceRawMaterialStock(data.rawMaterials);
    }

    await updatePackagingStock(current, data);
    await updateChemicalHardnerStock(current, data);

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
    await addPackagingStockBack(current);
    await addChemicalHardnerStockBack(current);
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
        createdAt: log.createdAt || null,
        updatedAt: log.updatedAt || null,
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
