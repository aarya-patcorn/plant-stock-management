const mongoose = require("mongoose");

const productMaterialLogSchema = new mongoose.Schema(
  {
    productCategory: { type: String, default: "" },
    token: { type: String, default: "" },
    color: { type: String, default: "" },
    productName: { type: String, default: "" },
    bagSize: { type: String, default: "" },

    currentQuantity: { type: Number, default: 0 },
    shippedQuantity: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProductMaterialLog", productMaterialLogSchema);