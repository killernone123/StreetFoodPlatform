const mongoose = require("mongoose");

const deliverySettingsSchema = new mongoose.Schema(
  {
    // Restaurant / Street Food shop location
    restaurantLat: {
      type: Number,
      required: true,
    },

    restaurantLng: {
      type: Number,
      required: true,
    },

    // Pricing type
    // SLAB = distance ke hisab se fixed slabs
    // PER_KM = har extra km ke hisab se charge
    pricingType: {
      type: String,
      enum: ["SLAB", "PER_KM"],
      default: "SLAB",
    },

    // Example:
    // ₹20 base delivery charge
    baseCharge: {
      type: Number,
      default: 20,
      min: 0,
    },

    // Itne km tak free
    freeDistanceKm: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Free distance ke baad per km charge
    perKmCharge: {
      type: Number,
      default: 10,
      min: 0,
    },

    // Maximum delivery distance
    maxDistanceKm: {
      type: Number,
      default: 12,
      min: 0,
    },

    // Slab pricing
    slabs: [
      {
        minKm: {
          type: Number,
          required: true,
          min: 0,
        },

        maxKm: {
          type: Number,
          required: true,
          min: 0,
        },

        charge: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DeliverySettings",
  deliverySettingsSchema
);