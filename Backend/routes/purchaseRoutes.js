const express = require("express");
const {
  createPurchaseEntry,
  updatePurchaseEntry,
  deletePurchaseEntry,
  getPurchaseEntries,
} = require("../controller/purchaseController");
const upload = require("../config/multer");

const router = express.Router();

router.post("/", upload.single("attachFile"), createPurchaseEntry);
router.get("/", getPurchaseEntries);
router.put("/:id", upload.single("attachFile"), updatePurchaseEntry);
router.delete("/:id", deletePurchaseEntry);

module.exports = router;
