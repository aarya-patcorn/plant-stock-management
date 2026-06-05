const express = require("express");
const { getDashboardReports } = require("../controller/dashboardController");

const router = express.Router();

router.get("/reports", getDashboardReports);

module.exports = router;
