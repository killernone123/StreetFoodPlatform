const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        image: {
            type: String,
            default: ""
        },

        isVeg: {
            type: Boolean,
            default: true
        },

        isAvailable: {
            type: Boolean,
            default: true
        },

        isPopular: {
            type: Boolean,
            default: false
        },

        preparationTime: {
            type: Number,
            default: 15
        },

        customizations: [
            {
                name: {
                    type: String,
                    required: true
                },

                options: [
                    {
                        name: String,
                        price: {
                            type: Number,
                            default: 0
                        }
                    }
                ]
            }
        ],

        addOns: [
            {
                name: String,

                price: {
                    type: Number,
                    default: 0
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const Food = mongoose.model("Food", foodSchema);

module.exports = Food;