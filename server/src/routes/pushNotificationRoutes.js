const express = require("express");
const router = express.Router();

const PushToken = require("../models/PushToken");

// =====================================================
// SAVE / UPDATE PUSH TOKEN
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      token,
      userType,
      userId,
      deviceName,
    } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Push token is required",
      });
    }

    if (!["customer", "admin"].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type",
      });
    }

    const pushToken =
      await PushToken.findOneAndUpdate(
        { token },

        {
          token,
          userType,
          userId: userId || null,
          deviceName: deviceName || "",
          isActive: true,
        },

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Push token registered successfully",
      data: pushToken,
    });
  } catch (error) {
    console.error(
      "❌ PUSH TOKEN REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to register push token",
    });
  }
});

module.exports = router;