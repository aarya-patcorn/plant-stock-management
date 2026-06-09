const mongoose = require("mongoose");

const reportLogSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      required: true,
      trim: true,
    },
    reportDate: {
      type: String,
      required: true,
      trim: true,
    },
    shiftName: {
      type: String,
      default: "",
      trim: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

reportLogSchema.index({ reportType: 1, reportDate: 1, shiftName: 1 }, { unique: true });

module.exports = mongoose.model("ReportLog", reportLogSchema);
