const Inventory = require("../model/Inventory");

const getInventory = async (_req, res) => {
  try {
    const inventory = await Inventory.find().sort({ createdAt: -1 });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getInventory };