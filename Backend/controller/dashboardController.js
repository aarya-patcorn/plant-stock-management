const ManufacturingEntry = require("../model/ManufacturingEntry");
const ProductMaterialLog = require("../model/ProductMaterialLog");

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const normalizeCategory = (value) => {
  const text = String(value || "").trim();
  return text || "Uncategorized";
};

const parseBagSizeToKg = (value) => {
  const text = String(value || "").trim().toLowerCase();

  if (!text) {
    return 0;
  }

  const match = text.match(/(\d+(?:\.\d+)?)/);

  if (!match) {
    return 0;
  }

  const quantity = Number(match[1]);

  if (!Number.isFinite(quantity)) {
    return 0;
  }

  if (text.includes("gm") || text.includes("gram")) {
    return quantity / 1000;
  }

  if (text.includes("mt") || text.includes("ton")) {
    return quantity * 1000;
  }

  return quantity;
};

const resolveProductionKg = (entry) => {
  const directQuantity = parseNumber(
    entry.totalProducedKg ?? entry.totalProductionKg ?? entry.batchQuantity ?? entry.materialQuantity,
  );
  const materialUnit = String(entry.materialUnit || entry.unit || "").trim().toLowerCase();

  if (directQuantity > 0) {
    if (materialUnit === "mt" || materialUnit === "ton" || materialUnit === "tons") {
      return directQuantity * 1000;
    }

    return directQuantity;
  }

  const productItems = Array.isArray(entry.productItems) ? entry.productItems : [];

  return productItems.reduce((sum, item) => {
    const totalBagsProduced = parseNumber(item.totalBagsProduced);
    const bagSizeInKg = parseBagSizeToKg(item.bagSize);
    return sum + totalBagsProduced * bagSizeInKg;
  }, 0);
};

const resolveTotalBagsProduced = (entry) => {
  const productItems = Array.isArray(entry.productItems) ? entry.productItems : [];

  if (productItems.length > 0) {
    return productItems.reduce((sum, item) => sum + parseNumber(item.totalBagsProduced), 0);
  }

  return parseNumber(entry.totalBagsProduced);
};

const formatProductStockRow = (log) => {
  const currentQuantity = parseNumber(log.currentQuantity ?? log.currentStock ?? log.availableStock);
  const dispatchedBags = parseNumber(log.shippedQuantity ?? log.dispatchedBags);

  return {
    productCategory: normalizeCategory(log.productCategory),
    productName: String(log.productName || log.finishedProductName || "").trim(),
    color: String(log.color || log.productColor || "").trim(),
    token: String(log.token || "").trim(),
    bagSize: String(log.bagSize || "").trim(),
    currentQuantity,
    currentStock: currentQuantity,
    availableBags: currentQuantity,
    dispatchedBags,
    shippedQuantity: dispatchedBags,
  };
};

const getDashboardReports = async (req, res) => {
  try {
    const fromDate = String(req.query.fromDate || "").trim();
    const toDate = String(req.query.toDate || "").trim();

    if (!isValidDateString(fromDate) || !isValidDateString(toDate)) {
      return res.status(400).json({
        success: false,
        message: "fromDate and toDate are required in YYYY-MM-DD format.",
      });
    }

    if (fromDate > toDate) {
      return res.status(400).json({
        success: false,
        message: "fromDate cannot be greater than toDate.",
      });
    }

    const [manufacturingEntries, productMaterialLogs] = await Promise.all([
      ManufacturingEntry.find({
        productionDate: {
          $gte: fromDate,
          $lte: toDate,
        },
      }).lean(),
      ProductMaterialLog.find().lean(),
    ]);

    const stockSummaryByCategory = new Map();
    const productStocksByCategory = {};

    productMaterialLogs.forEach((log) => {
      const category = normalizeCategory(log.productCategory);
      const formattedLog = formatProductStockRow(log);

      if (!productStocksByCategory[category]) {
        productStocksByCategory[category] = [];
      }

      productStocksByCategory[category].push(formattedLog);

      const currentSummary = stockSummaryByCategory.get(category) || {
        productsCount: 0,
        totalCurrentStock: 0,
      };

      stockSummaryByCategory.set(category, {
        productsCount: currentSummary.productsCount + 1,
        totalCurrentStock: currentSummary.totalCurrentStock + formattedLog.currentQuantity,
      });
    });

    Object.keys(productStocksByCategory).forEach((category) => {
      productStocksByCategory[category].sort(
        (left, right) => parseNumber(right.currentQuantity) - parseNumber(left.currentQuantity),
      );
    });

    const productionByCategoryMap = new Map();

    manufacturingEntries.forEach((entry) => {
      const category = normalizeCategory(entry.productCategory);
      const currentCategory = productionByCategoryMap.get(category) || {
        productCategory: category,
        totalProductionKg: 0,
        totalBagsProduced: 0,
        totalEntries: 0,
        productsCount: stockSummaryByCategory.get(category)?.productsCount || 0,
        totalCurrentStock: stockSummaryByCategory.get(category)?.totalCurrentStock || 0,
      };

      currentCategory.totalProductionKg += resolveProductionKg(entry);
      currentCategory.totalBagsProduced += resolveTotalBagsProduced(entry);
      currentCategory.totalEntries += 1;

      productionByCategoryMap.set(category, currentCategory);
    });

    const productionByCategory = Array.from(productionByCategoryMap.values()).sort((left, right) =>
      left.productCategory.localeCompare(right.productCategory),
    );

    return res.json({
      success: true,
      data: {
        productionByCategory,
        productStocksByCategory,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardReports,
};
