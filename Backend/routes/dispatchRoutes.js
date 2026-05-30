const express = require("express");
const {
  getDispatchEntries,
  createDispatchEntry,
  updateDispatchEntry,
  deleteDispatchEntry,
} = require("../controller/dispatchController");

const router = express.Router();

router.get("/", getDispatchEntries);
router.post("/", createDispatchEntry);
router.put("/:id", updateDispatchEntry);
router.delete("/:id", deleteDispatchEntry);

module.exports = router;