const mongoose = require("mongoose");

const purchaseEntrySchema = new mongoose.Schema(
  {
    date: String,
    time: String,
    rawMaterialName: String,
    packagingType: String,
    level2: String,
    level3: String,
    level4: String,
    packagingBagColor: String,
    bucketSize: String,
    bagColor: String,
    sandEpoxyColor: String,
    quantityPurchased: Number,
    purchaseStock: Number,
    unit: String,
    supplierName: String,
    invoiceNo: String,
    unloadBy: String,
    attachFile: String,
    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("PurchaseEntry", purchaseEntrySchema);