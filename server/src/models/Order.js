const mongoose = require("mongoose");


const orderItemSchema = new mongoose.Schema(
    {
        foodId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Food",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },

        customizations: [
            {
                name: String,
                price: {
                    type: Number,
                    default: 0
                }
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
    { _id: false }
);


const orderSchema = new mongoose.Schema(
    {
        userId: {
            type:
                mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        orderNumber: {
            type: String,
            required: true,
            unique: true
        },

        customer: {
            name: {
                type: String,
                required: true,
                trim: true
            },

            phone: {
                type: String,
                required: true,
                trim: true
            },

            address: {
                type: String,
                required: true,
                trim: true
            },

            landmark: {
                type: String,
                default: "",
                trim: true
            }
        },

        items: {
            type: [orderItemSchema],
            required: true
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        deliveryCharge: {
            type: Number,
            required: true,
            min: 0
        },

        grandTotal: {
            type: Number,
            required: true,
            min: 0
        },

        paymentMethod: {
            type: String,
            enum: ["COD", "ONLINE"],
            default: "COD"
        },

        paymentStatus: {
            type: String,
            enum: [
                "PENDING",
                "PAID",
                "FAILED"
            ],
            default: "PENDING"
        },
        razorpayOrderId: {
            type: String,
            default: ""
        },

        razorpayPaymentId: {
            type: String,
            default: ""
        },

        razorpaySignature: {
            type: String,
            default: ""
        },

        orderStatus: {
            type: String,
            enum: [
                "PLACED",
                "CONFIRMED",
                "PREPARING",
                "READY",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED"
            ],
            default: "PLACED"
        }
    },
    {
        timestamps: true
    }
);


const Order = mongoose.model(
    "Order",
    orderSchema
);

module.exports = Order;