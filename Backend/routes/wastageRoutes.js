const express = require("express");
const { getWastageQty } = require("../controller/wastageController");
const { updateRemainingWastageQty } = require("../controller/wastageController");

const router = express.Router();

router.get("/", getWastageQty);
router.patch("/update-remaining", updateRemainingWastageQty);

module.exports = router;