const DispatchEntry = require("../model/DispatchEntry");
const ProductMaterialLog  = require("../model/ProductMaterialLog");
const Wastage = require("../model/Wastage");
const syncToGoogleSheet = require("../utils/googleSheetSync");

const parseNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const buildProductMaterialFilter = (data) => {
  return {
    productCategory: data.productCategory || "",
    token: data.token || "",
    color: data.color || data.productColor || "",
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

const getTphBatchFromDispatch = ({ productCategory, color, productColor }) => {
  const dispatchColor = color || productColor || "";

  if (productCategory === "Grout" || productCategory === "Tile Grout") return "Manual Blender";
  if (productCategory === "Epoxy") return "Sigma Mixer";
  if (productCategory === "Tile Cleaner") return "Manual Hand Mixer";

  if (productCategory === "Tile Adhesive") {
    if (dispatchColor === "Grey") return "2TPH";
    if (dispatchColor === "White") return "1TPH";
  }

  return "";
};

const validateDispatchWastage = (data) => {
  const wastageQty = parseNumber(data.wastageQty);

  if (wastageQty < 0) {
    throw new Error("Wastage quantity cannot be negative.");
  }

  if (wastageQty <= 0) {
    return {
      wastageQty,
      tphBatch: "",
      finishedProductName: "",
    };
  }

  const productCategory = data.productCategory || "";
  const productColor = data.productColor || data.color || "";

  if (productCategory === "Tile Adhesive" && !String(productColor).trim()) {
    throw new Error("Product color is required for Tile Adhesive wastage.");
  }

  const tphBatch = getTphBatchFromDispatch({
    productCategory,
    color: data.color,
    productColor,
  });

  if (!tphBatch) {
    throw new Error("TPH batch mapping not found for dispatch wastage.");
  }

  return {
    wastageQty,
    tphBatch,
    finishedProductName: data.productName || data.finishedProductName || "",
  };
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
  user: data.user || "",
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
  wastageQty: parseNumber(data.wastageQty),
  remarks: data.remarks || "",
});

const syncDispatchToGoogleSheet = async (dispatchEntry) => {
  const entry = dispatchEntry.toObject ? dispatchEntry.toObject() : dispatchEntry;
  console.log("[dispatchController] syncing dispatch entry to Google Sheet", entry?._id || "new");
  await syncToGoogleSheet({
    action: "DISPATCH",
    dispatch: entry,
    productMaterialRows: [{
      productCategory: entry.productCategory || "", productName: entry.productName || "",
      token: entry.token || "", color: entry.productColor || entry.color || "",
      bagSize: entry.bagSize || "", quantity: Number(entry.totalBags) || 0,
    }],
  });
};

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
    const wastageDetails = validateDispatchWastage(req.body);
    const entry = await DispatchEntry.create(normalizeDispatchData(req.body));
    
    await reduceProductMaterialStock(entry);

    if (wastageDetails.wastageQty > 0) {
      const wastageFilter = {
        tphBatch: wastageDetails.tphBatch,
        finishedProductName: wastageDetails.finishedProductName,
      };

      console.log("[Dispatch Wastage] filter:", wastageFilter);

      const existingWastage = await Wastage.findOne(wastageFilter);

      console.log("[Dispatch Wastage] existing:", existingWastage);
      console.log("[Dispatch Wastage] adding qty:", req.body.wastageQty);

      if (existingWastage) {
        existingWastage.wastageQty =
          (Number(existingWastage.wastageQty) || 0) + wastageDetails.wastageQty;
        existingWastage.date = req.body.date || req.body.dispatchDate || existingWastage.date;
        await existingWastage.save();
      } else {
        await Wastage.create({
          date: req.body.date || req.body.dispatchDate || "",
          tphBatch: wastageDetails.tphBatch,
          finishedProductName: wastageDetails.finishedProductName,
          wastageQty: wastageDetails.wastageQty,
        });
      }
    }

    await syncDispatchToGoogleSheet(entry);

    res.status(201).json({ success: true, message: "Dispatch entry created successfully", data: entry });
  } catch (error) {
    console.error("Error creating dispatch entry:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDispatchEntry = async (req, res) => {
  try {
    validateDispatchWastage(req.body);
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
