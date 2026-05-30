const DispatchEntry = require("../model/DispatchEntry");
const ProductMaterialLog  = require("../model/ProductMaterialLog");

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const buildProductMaterialFilter = (data) => {
  return {
    productCategory: data.productCategory || "",
    token: data.token || "",
    color: data.productColor || data.color || "",
    productName: data.productName || "",
    bagSize: data.bagSize || "",
  };
};

const buildProductMaterialLabel = (data) => {
  return [
    data.productCategory,
    data.token,
    data.productColor || data.color,
    data.productName,
    data.bagSize,
  ]
    .filter(Boolean)
    .join(" ");
};

const reduceProductMaterialStock = async (dispatchItems) => {
  const items = Array.isArray(dispatchItems) ? dispatchItems : [dispatchItems];

  for (const item of items) {
    const filter = buildProductMaterialFilter(item);
    const label = buildProductMaterialLabel(item);
    const dispatchQty = parseNumber(item.totalBags || item.quantity);

    const productStock = await ProductMaterialLog.findOne(filter);

    if (!productStock) {
      throw new Error(`${label} stock is not available in product material log.`);
    }

    const currentStock = parseNumber(productStock.currentQuantity);

    if (currentStock < dispatchQty) {
      throw new Error(
        `${label} has only ${currentStock} bags available, but ${dispatchQty} bags are required.`
      );
    }
  }

  for (const item of items) {
    const filter = buildProductMaterialFilter(item);
    const dispatchQty = parseNumber(item.totalBags || item.quantity);

    await ProductMaterialLog.updateOne(filter, {
      $inc: {
        currentQuantity: -dispatchQty,
        shippedQuantity: dispatchQty,
      },
    });
  }
};

const normalizeDispatchData = (data) => ({
  date: data.date || "",
  time: data.time || "",
  challanNo: data.challanNo || "",
  challanName: data.challanName || "",
  vehicleNo: data.vehicleNo || "",
  driverName: data.driverName || "",
  driverContact: data.driverContact || "",
  dispatchTime: data.dispatchTime || "",
  dispatchSite: data.dispatchSite || "",
  todayVehicleNo: data.todayVehicleNo || "",
  token: data.token || "",
  productCategory: data.productCategory || "",
  productColor: data.productColor || "",
  productName: data.productName || "",
  bagSize: data.bagSize || "",
  quantity: parseNumber(data.quantity),
  totalBags: parseNumber(data.totalBags),
});

const getDispatchEntries = async (_req, res) => {
  try {
    const entries = await DispatchEntry.find().sort({ createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDispatchEntry = async (req, res) => {
  try {
    const entry = await DispatchEntry.create(normalizeDispatchData(req.body));
    
    await reduceProductMaterialStock(entry);

    res.status(201).json({ success: true, message: "Dispatch entry created successfully", data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDispatchEntry = async (req, res) => {
  try {
    const entry = await DispatchEntry.findByIdAndUpdate(req.params.id, normalizeDispatchData(req.body), {
      new: true,
      runValidators: true,
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: "Dispatch entry not found" });
    }

    res.json({ success: true, message: "Dispatch entry updated successfully", data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDispatchEntry = async (req, res) => {
  try {
    const entry = await DispatchEntry.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: "Dispatch entry not found" });
    }

    res.json({ success: true, message: "Dispatch entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDispatchEntries,
  createDispatchEntry,
  updateDispatchEntry,
  deleteDispatchEntry,
};