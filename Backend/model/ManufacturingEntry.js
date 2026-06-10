const mongoose = require("mongoose");

const rawMaterialSchema = new mongoose.Schema(
  {
    rawMaterialName: String,
    packagingType: String,
    level2: String,
    level3: String,
    level4: String,
    packagingBag: String,
    packagingBagColor: String,
    bucketSize: String,
    bagColor: String,
    sandEpoxyColor: String,
    colorOfSandEpoxy: String,
    materialQuantity: Number,
    materialUnit: String,
  },
  { _id: false }
);

const productItemSchema = new mongoose.Schema(
  {
    token: { type: String, default: "" },
    bagSize: { type: String, default: "" },
    totalBagsProduced: { type: Number, default: 0 },
  },
  { _id: false }
);

const manufacturingEntrySchema = new mongoose.Schema(
  {
    productionDate: String,
    tphBatch: String,
    user: String,
    batchNo: {
      type: String,
      required: true,
      trim: true,
    },

    productCategory: String,
    materialQuantity: String,
    materialUnit: String,

    color: String,
    finishedProductName: String,
    canSize: String,
    totalCan: String,

    productItems: [productItemSchema],

    sticker: String,
    sponge: String,
    wastageQty: Number,
    wastageReason: String,
    remarks: String,

    rawMaterials: [rawMaterialSchema],
  },
  { timestamps: true }
);
module.exports = mongoose.model("ManufacturingEntry", manufacturingEntrySchema);
