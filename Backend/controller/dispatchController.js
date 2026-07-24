const crypto = require("crypto");
const mongoose = require("mongoose");
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

const reduceProductMaterialStock = async (dispatchItems, session) => {
  const items = Array.isArray(dispatchItems) ? dispatchItems : [dispatchItems];

  for (const item of items) {
    const filter = buildProductMaterialFilter(item);
    const label = buildProductMaterialLabel(item);
    const dispatchQty = parseNumber(item.totalBags || item.quantity);

    const productStock = await ProductMaterialLog.findOne(filter).session(session);

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
    }, { session });
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

const normalizeRequestKeyPart = (value) => String(value ?? "").trim().toLowerCase();

const buildDispatchDuplicateFilter = (data) => ({
  date: data.date,
  time: data.time,
  challanNo: data.challanNo,
  productCategory: data.productCategory,
  productName: data.productName,
  token: data.token,
  productColor: data.productColor,
  bagSize: data.bagSize,
  totalBags: data.totalBags,
});

const buildDispatchRequestKey = (data) =>
  crypto
    .createHash("sha256")
    .update(
      JSON.stringify([
        normalizeRequestKeyPart(data.date),
        normalizeRequestKeyPart(data.time),
        normalizeRequestKeyPart(data.challanNo),
        normalizeRequestKeyPart(data.productCategory),
        normalizeRequestKeyPart(data.productName),
        normalizeRequestKeyPart(data.token),
        normalizeRequestKeyPart(data.productColor || data.color),
        normalizeRequestKeyPart(data.bagSize),
        parseNumber(data.totalBags),
      ]),
    )
    .digest("hex");

const syncDispatchToGoogleSheet = async (dispatchEntry) => {
  const entry = dispatchEntry.toObject ? dispatchEntry.toObject() : dispatchEntry;
  console.log("[dispatchController] syncing dispatch entry to Google Sheet", entry?._id || "new");
  await syncToGoogleSheet({
    action: "DISPATCH",
    dispatch: {
      ...entry,
      quantity: Number(entry.totalBags) || 0,
    },
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
  const productItems = Array.isArray(req.body?.productItems) ? req.body.productItems : [];
  const rawEntries = productItems.length > 0
    ? productItems.map((product) => ({ ...req.body, ...product, productItems: undefined }))
    : [req.body];

  if (rawEntries.length === 0) {
    return res.status(400).json({ success: false, message: "At least one dispatch product is required." });
  }

  const preparedEntries = [];
  const requestKeys = new Set();

  try {
    for (let index = 0; index < rawEntries.length; index += 1) {
      const rawEntry = rawEntries[index];
      let wastageDetails;
      let data;

      try {
        wastageDetails = validateDispatchWastage(rawEntry);
        data = normalizeDispatchData(rawEntry);

        if (data.totalBags <= 0) {
          throw new Error("Departed bags must be greater than 0.");
        }
      } catch (error) {
        error.message = `Product ${index + 1}: ${error.message}`;
        error.statusCode = 400;
        throw error;
      }

      const requestKey = buildDispatchRequestKey(data);
      if (requestKeys.has(requestKey)) {
        const duplicateError = new Error(`Product ${index + 1}: The same product appears more than once in this dispatch.`);
        duplicateError.statusCode = 400;
        throw duplicateError;
      }

      requestKeys.add(requestKey);
      preparedEntries.push({ data, requestKey, wastageDetails });
    }

    await DispatchEntry.init();
    const session = await mongoose.startSession();
    const savedEntries = [];
    let committed = false;

    try {
      session.startTransaction();

      for (const { data, requestKey, wastageDetails } of preparedEntries) {
        const existingEntry = await DispatchEntry.findOne({
          $or: [
            { requestKey },
            buildDispatchDuplicateFilter(data),
          ],
        }).session(session);

        if (existingEntry) {
          savedEntries.push({ entry: existingEntry, duplicate: true });
          continue;
        }

        const entry = new DispatchEntry({ ...data, requestKey });
        await entry.save({ session });
        await reduceProductMaterialStock(entry, session);

        if (wastageDetails.wastageQty > 0) {
          const wastageFilter = {
            tphBatch: wastageDetails.tphBatch,
            finishedProductName: wastageDetails.finishedProductName,
          };
          const existingWastage = await Wastage.findOne(wastageFilter).session(session);

          if (existingWastage) {
            existingWastage.wastageQty =
              parseNumber(existingWastage.wastageQty) + wastageDetails.wastageQty;
            existingWastage.date = data.date || existingWastage.date;
            await existingWastage.save({ session });
          } else {
            const wastage = new Wastage({
              date: data.date,
              tphBatch: wastageDetails.tphBatch,
              finishedProductName: wastageDetails.finishedProductName,
              wastageQty: wastageDetails.wastageQty,
            });
            await wastage.save({ session });
          }
        }

        await syncDispatchToGoogleSheet(entry);
        savedEntries.push({ entry, duplicate: false });
      }

      await session.commitTransaction();
      committed = true;
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      await session.endSession();
    }

    if (!committed) {
      throw new Error("Dispatch transaction did not commit.");
    }

    const entries = savedEntries.map(({ entry }) => entry);
    const savedCount = savedEntries.filter(({ duplicate }) => !duplicate).length;
    const isSingleEntry = entries.length === 1;

    return res.status(savedCount === 0 ? 200 : 201).json({
      success: true,
      duplicate: savedCount === 0,
      message: isSingleEntry
        ? (savedCount === 0
          ? "This dispatch entry was already saved."
          : "Dispatch entry created successfully")
        : `${entries.length} dispatch entries processed successfully.`,
      savedCount,
      duplicateCount: entries.length - savedCount,
      googleSheetSynced: true,
      data: isSingleEntry ? entries[0] : entries,
    });
  } catch (error) {
    console.error("Error creating dispatch entries:", error);
    const statusCode = Number(error?.statusCode) || (error?.code === 11000 ? 409 : 500);
    return res.status(statusCode).json({ success: false, message: error.message });
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
