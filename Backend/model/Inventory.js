const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    rawMaterialName: String,
    packagingType: String,
    level2: String,
    level3: String,
    level4: String,
    packagingBagColor: String,
    coupon: {
      type: String,
      default: "",
      trim: true,
    },
    bucketSize: String,
    bagColor: String,
    sandEpoxyColor: String,
    purchaseStock: { type: Number, default: 0 },
    usedInProduction: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 },
    unit: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);