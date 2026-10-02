const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");

const userAuth = require("../middleware/userAuth");
const Order = require("../models/Order");

const router = express.Router();


// =====================================================
// RAZORPAY INSTANCE
// =====================================================

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post(
    "/create-order",
    userAuth,
    async (req, res) => {

        try {

            const { orderId } = req.body;


            // ---------------------------------------------
            // VALIDATE ORDER ID
            // ---------------------------------------------

            if (!orderId) {
                return res.status(400).json({
                    success: false,
                    message: "Order ID is required"
                });
            }


            if (
                !mongoose.Types.ObjectId.isValid(
                    orderId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid order ID"
                });
            }


            // ---------------------------------------------
            // FIND CUSTOMER ORDER
            // ---------------------------------------------

            const order =
                await Order.findOne({
                    _id: orderId,
                    userId: req.user.id
                });


            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }


            // ---------------------------------------------
            // CHECK PAYMENT METHOD
            // ---------------------------------------------

            if (
                order.paymentMethod !== "ONLINE"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This order is not an online payment order"
                });
            }


            // ---------------------------------------------
            // CHECK PAYMENT STATUS
            // ---------------------------------------------

            if (
                order.paymentStatus === "PAID"
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Order is already paid"
                });
            }


            // ---------------------------------------------
            // CREATE RAZORPAY ORDER
            // ---------------------------------------------

            const amountInPaise =
                Math.round(
                    order.grandTotal * 100
                );


            const razorpayOrder =
                await razorpay.orders.create({

                    amount:
                        amountInPaise,

                    currency:
                        "INR",

                    receipt:
                        order.orderNumber,

                    notes: {
                        orderId:
                            order._id.toString(),

                        orderNumber:
                            order.orderNumber
                    }
                });


            // ---------------------------------------------
            // SAVE RAZORPAY ORDER ID
            // ---------------------------------------------

            order.razorpayOrderId =
                razorpayOrder.id;


            await order.save();


            // ---------------------------------------------
            // RESPONSE
            // ---------------------------------------------

            return res.status(200).json({

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


            return res.status(500).json({

                success: false,

                message:
                    "Failed to create payment order"
            });
        }
    }
);


// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

router.post(
    "/verify",
    userAuth,
    async (req, res) => {

        try {

            const {
                orderId,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;


            // ---------------------------------------------
            // VALIDATE PAYMENT DATA
            // ---------------------------------------------

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


            // ---------------------------------------------
            // VALIDATE ORDER ID
            // ---------------------------------------------

            if (
                !mongoose.Types.ObjectId.isValid(
                    orderId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid order ID"
                });
            }


            // ---------------------------------------------
            // FIND CUSTOMER ORDER
            // ---------------------------------------------

            const order =
                await Order.findOne({

                    _id:
                        orderId,

                    userId:
                        req.user.id
                });


            if (!order) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found"
                });
            }


            // ---------------------------------------------
            // CHECK PAYMENT METHOD
            // ---------------------------------------------

            if (
                order.paymentMethod !== "ONLINE"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This order is not an online payment order"
                });
            }


            // ---------------------------------------------
            // CHECK RAZORPAY ORDER ID
            // ---------------------------------------------

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


            // ---------------------------------------------
            // GENERATE SIGNATURE
            // ---------------------------------------------

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


            // ---------------------------------------------
            // SAFE SIGNATURE COMPARISON
            // ---------------------------------------------

            const generatedBuffer =
                Buffer.from(
                    generatedSignature,
                    "utf8"
                );


            const receivedBuffer =
                Buffer.from(
                    razorpay_signature,
                    "utf8"
                );


            const isSignatureValid =
                generatedBuffer.length ===
                    receivedBuffer.length &&
                crypto.timingSafeEqual(
                    generatedBuffer,
                    receivedBuffer
                );


            // ---------------------------------------------
            // INVALID SIGNATURE
            // ---------------------------------------------

            if (!isSignatureValid) {

                order.paymentStatus =
                    "FAILED";


                await order.save();


                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment signature"
                });
            }


            // ---------------------------------------------
            // ALREADY PAID CHECK
            // ---------------------------------------------

            if (
                order.paymentStatus === "PAID"
            ) {

                return res.status(200).json({

                    success: true,

                    message:
                        "Payment already verified",

                    order
                });
            }


            // ---------------------------------------------
            // PAYMENT VERIFIED
            // ---------------------------------------------

            order.paymentStatus =
                "PAID";


            order.razorpayPaymentId =
                razorpay_payment_id;


            order.razorpaySignature =
                razorpay_signature;


            await order.save();


            // ---------------------------------------------
            // SEND PAID ORDER TO ADMIN
            // ---------------------------------------------

            const io =
                req.app.get("io");


            if (io) {

                io.to("admin_room").emit(
                    "newOrder",
                    order
                );


                console.log(
                    "🔔 NEW PAID ORDER SENT TO ADMIN"
                );


                console.log(
                    "📦 Order:",
                    order.orderNumber
                );


                console.log(
                    "💳 Payment:",
                    order.paymentStatus
                );


                console.log(
                    "👥 Admin room clients:",
                    io.sockets
                        .adapter
                        .rooms
                        .get("admin_room")
                        ?.size || 0
                );
            }


            // ---------------------------------------------
            // SUCCESS RESPONSE
            // ---------------------------------------------

            return res.status(200).json({

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


            return res.status(500).json({

                success: false,

                message:
                    "Payment verification failed"
            });
        }
    }
);


module.exports = router;