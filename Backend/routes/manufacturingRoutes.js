const express = require("express");
const {
  getManufacturingEntries,
  createManufacturingEntry,
  updateManufacturingEntry,
  deleteManufacturingEntry,
  getProductionMaterialLogs,
} = require("../controller/manufacturingController");

const router = express.Router();

router.get("/logs/production-materials", getProductionMaterialLogs);
router.get("/", getManufacturingEntries);
router.post("/", createManufacturingEntry);
router.put("/:id", updateManufacturingEntry);
router.delete("/:id", deleteManufacturingEntry);

module.exports = router;