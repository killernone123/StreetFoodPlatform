const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const userAuth = require("../middleware/userAuth");
const Order = require("../models/Order");

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post("/create-order", userAuth, async (req, res) => {

    try {

        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }


        const order = await Order.findOne({
            _id: orderId,
            userId: req.user.id
        });


        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }


        if (order.paymentMethod !== "ONLINE") {
            return res.status(400).json({
                success: false,
                message: "This order is not an online payment order"
            });
        }


        if (order.paymentStatus === "PAID") {
            return res.status(400).json({
                success: false,
                message: "Order is already paid"
            });
        }


        // Amount must be in paise
        const amountInPaise =
            Math.round(order.grandTotal * 100);


        const razorpayOrder =
            await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",

                receipt: order.orderNumber,

                notes: {
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber
                }
            });


        // Save Razorpay order ID
        order.razorpayOrderId =
            razorpayOrder.id;

        await order.save();


        res.status(200).json({

            success: true,

            message:
                "Razorpay order created",

            razorpayOrderId:
                razorpayOrder.id,

            amount:
                razorpayOrder.amount,

            currency:
                razorpayOrder.currency,

            key:
                process.env.RAZORPAY_KEY_ID,

            orderId:
                order._id

        });


    } catch (error) {

        console.error(
            "Razorpay Create Order Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to create payment order"

        });

    }

});


// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

router.post("/verify", userAuth, async (req, res) => {

    try {

        const {
            orderId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;


        if (
            !orderId ||
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Payment verification data missing"

            });

        }


        const order = await Order.findOne({
            _id: orderId,
            userId: req.user.id
        });


        if (!order) {

            return res.status(404).json({

                success: false,

                message: "Order not found"

            });

        }


        if (
            order.razorpayOrderId !==
            razorpay_order_id
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Razorpay order ID mismatch"

            });

        }


        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(
                    razorpay_order_id +
                    "|" +
                    razorpay_payment_id
                )
                .digest("hex");


        if (
            generatedSignature !==
            razorpay_signature
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid payment signature"

            });

        }


        order.paymentStatus = "PAID";

        order.razorpayPaymentId =
            razorpay_payment_id;

        order.razorpaySignature =
            razorpay_signature;

        await order.save();


        res.status(200).json({

            success: true,

            message:
                "Payment verified successfully",

            order

        });


    } catch (error) {

        console.error(
            "Razorpay Verification Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Payment verification failed"

        });

    }

});


module.exports = router;