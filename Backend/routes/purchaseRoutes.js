const express = require("express");
const {
  createPurchaseEntry,
  updatePurchaseEntry,
  deletePurchaseEntry,
  getPurchaseEntries,
} = require("../controller/purchaseController");

const router = express.Router();

router.post("/", createPurchaseEntry);
router.get("/", getPurchaseEntries);
router.put("/:id", updatePurchaseEntry);
router.delete("/:id", deletePurchaseEntry);

module.exports = router;