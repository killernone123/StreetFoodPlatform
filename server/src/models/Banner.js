const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            trim: true,
            default: "",
        },

        image: {
            type: String,
            trim: true,
            default: "",
        },

        type: {
            type: String,
            enum: [
                "offer",
                "important",
                "festival",
                "delivery",
                "general",
            ],
            default: "general",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        startDate: {
            type: Date,
            default: null,
        },

        endDate: {
            type: Date,
            default: null,
        },

        sortOrder: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Banner", bannerSchema);