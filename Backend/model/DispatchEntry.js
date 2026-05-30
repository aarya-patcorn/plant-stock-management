const mongoose = require("mongoose");

const dispatchEntrySchema = new mongoose.Schema(
  {
    date: String,
    time: String,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("DispatchEntry", dispatchEntrySchema);