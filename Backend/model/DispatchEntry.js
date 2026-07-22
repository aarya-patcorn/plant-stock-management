const mongoose = require("mongoose");

const dispatchEntrySchema = new mongoose.Schema(
  {
    requestKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    date: String,
    time: String,
    user: String,
    challanNo: String,
    challanName: String,
    vehicleNo: String,
    driverName: String,
    driverContact: String,
    dispatchTime: String,
    dispatchSite: String,
    todayVehicleNo: String,
    token: String,
    productCategory: String,
    productColor: String,
    productName: String,
    bagSize: String,
    quantity: Number,
    totalBags: Number,
    wastageQty: Number,
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DispatchEntry", dispatchEntrySchema);
