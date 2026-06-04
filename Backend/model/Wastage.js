const mongoose = require('mongoose');

const wastageSchema = new mongoose.Schema(
    {
        date: String,
        tphBatch: String,
        finishedProductName: String,
        wastageQty: Number
    },
    { timestamps: true }
);  

module.exports = mongoose.model('Wastage', wastageSchema);