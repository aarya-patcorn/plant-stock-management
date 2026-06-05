const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../model/User");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const userId = String(req.body.userId || "").trim();
    const password = String(req.body.password || "").trim();

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: "User ID and password are required.",
        data: false,
      });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid user ID or password.",
        data: false,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        userId: user.userId,
        userName: user.userName,
      },
    });
    } catch (error) {
      console.error("Login Error:", error);

      return res.status(500).json({
        success: false,
        message: "Internal server error.",
        data: false,
      });
    }
  });

router.post("/signup", async (req, res) => {
  try {
    const userId = String(req.body.userId || "").trim();
    const password = String(req.body.password || "").trim();
    const userName = String(req.body.userName || "").trim();

    if (!userId || !password || !userName) {
      return res.status(400).json({
        success: false,
        message: "User ID, password, and user name are required.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ userId });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      userId,
      password: hashedPassword,
      userName,
    });

    return res.status(201).json({
      success: true,
      message: "Signup successful.",
      data: {
        id: user._id,
        userId: user.userId,
        userName: user.userName,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
});

module.exports = router;