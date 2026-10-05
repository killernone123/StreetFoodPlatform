const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: false,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },

    orderNumber: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "FEEDBACK",
        "COMPLAINT",
        "GENERAL",
      ],
      default: "FEEDBACK",
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: false,
    },

    subject: {
      type: String,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "NEW",
        "READ",
        "RESOLVED",
      ],
      default: "NEW",
    },

    adminReply: {
      type: String,
      trim: true,
    },

    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Support",
  supportSchema
);