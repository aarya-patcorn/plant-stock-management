const express = require("express");
const { getInventory } = require("../controller/inventoryController");

const router = express.Router();

router.get("/", getInventory);

module.exports = router;