const express = require("express");

const router = express.Router();

router.post("/login", (req, res) => {
  const userId = String(req.body.userId || "").trim();
  const password = String(req.body.password || "").trim();
  const configuredUser = process.env.ADMIN_USER_ID;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (configuredUser || configuredPassword) {
    const isValid = userId === configuredUser && password === configuredPassword;

    return res.status(isValid ? 200 : 401).json({
      success: isValid,
      message: isValid ? "Login successful" : "Invalid user ID or password.",
      data: isValid,
    });
  }

  const isValid = Boolean(userId && password);
  res.status(isValid ? 200 : 401).json({
    success: isValid,
    message: isValid ? "Login successful" : "Invalid user ID or password.",
    data: isValid,
  });
});

module.exports = router;