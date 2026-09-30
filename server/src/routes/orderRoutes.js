const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Food = require("../models/Food");

const userAuth = require("../middleware/userAuth");
const adminAuth = require("../middleware/adminAuth");

const razorpay = require("../config/razorpay");

const router = express.Router();


// =====================================
// CREATE ORDER - CUSTOMER
// =====================================

router.post("/", userAuth, async (req, res) => {
    try {

        const {
            customer,
            items,
            paymentMethod
        } = req.body;


        // =====================================
        // BASIC VALIDATION
        // =====================================

        if (!customer) {
            return res.status(400).json({
                success: false,
                message: "Customer details are required"
            });
        }


        if (
            !customer.name ||
            !customer.phone ||
            !customer.address
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Name, phone and address are required"
            });
        }


        if (
            !items ||
            !Array.isArray(items) ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }


        // =====================================
        // VALIDATE PAYMENT METHOD
        // =====================================

        if (
            !["COD", "ONLINE"].includes(paymentMethod)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        // =====================================
        // VERIFY RAZORPAY PAYMENT - CUSTOMER
        // =====================================

        router.post(
            "/verify-payment",
            userAuth,
            async (req, res) => {

                try {

                    const {
                        orderId,
                        razorpay_payment_id,
                        razorpay_order_id,
                        razorpay_signature
                    } = req.body;


                    // =====================================
                    // BASIC VALIDATION
                    // =====================================

                    if (
                        !orderId ||
                        !razorpay_payment_id ||
                        !razorpay_order_id ||
                        !razorpay_signature
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Payment verification details are incomplete"
                        });
                    }


                    // =====================================
                    // VALIDATE APP ORDER ID
                    // =====================================

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


                    // =====================================
                    // FIND CUSTOMER ORDER
                    // =====================================

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


                    // =====================================
                    // CHECK RAZORPAY ORDER ID
                    // =====================================

                    if (
                        order.razorpayOrderId !==
                        razorpay_order_id
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Razorpay order ID does not match"
                        });
                    }


                    // =====================================
                    // CREATE SIGNATURE
                    // =====================================

                    const crypto =
                        require("crypto");


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


                    // =====================================
                    // VERIFY SIGNATURE
                    // =====================================

                    const generatedBuffer =
                        Buffer.from(generatedSignature);

                    const receivedBuffer =
                        Buffer.from(razorpay_signature);

                    const isSignatureValid =
                        generatedBuffer.length ===
                        receivedBuffer.length &&
                        crypto.timingSafeEqual(
                            generatedBuffer,
                            receivedBuffer
                        );;


                    if (!isSignatureValid) {

                        order.paymentStatus =
                            "FAILED";

                        await order.save();


                        return res.status(400).json({

                            success: false,

                            message:
                                "Payment signature verification failed"
                        });
                    }


                    // =====================================
                    // PAYMENT VERIFIED
                    // =====================================

                    order.paymentStatus =
                        "PAID";


                    order.razorpayPaymentId =
                        razorpay_payment_id;


                    order.razorpaySignature =
                        razorpay_signature;


                    await order.save();


                    // =====================================
                    // SEND ORDER TO ADMIN
                    // =====================================

                    const io =
                        req.app.get("io");


                    if (io) {

                        io.to("admin_room").emit(
                            "newOrder",
                            order
                        );


                        console.log(
                            "🔔 PAID order sent to admin:",
                            order.orderNumber
                        );
                    }


                    // =====================================
                    // RESPONSE
                    // =====================================

                    return res.status(200).json({

                        success: true,

                        message:
                            "Payment verified successfully",

                        order
                    });


                } catch (error) {

                    console.error(
                        "Payment Verification Error:",
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

        // =====================================
        // GET FOOD IDs
        // =====================================

        const foodIds = items.map(
            (item) => item.foodId
        );


        // =====================================
        // GET FOODS FROM DATABASE
        // =====================================

        const foods = await Food.find({
            _id: {
                $in: foodIds
            }
        });


        let subtotal = 0;

        const orderItems = [];


        // =====================================
        // CALCULATE EACH ITEM
        // =====================================

        for (const item of items) {

            // =================================
            // VALIDATE FOOD ID
            // =================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    item.foodId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid food ID"
                });
            }


            // =================================
            // FIND FOOD
            // =================================

            const food = foods.find(
                (foodItem) =>
                    foodItem._id.toString() ===
                    item.foodId
            );


            if (!food) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Food item not found"
                });
            }


            // =================================
            // CHECK AVAILABILITY
            // =================================

            if (!food.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message:
                        `${food.name} is currently unavailable`
                });
            }


            // =================================
            // QUANTITY
            // =================================

            const quantity =
                Number(item.quantity);


            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid quantity"
                });
            }


            // =====================================
            // CUSTOMIZATION PRICE
            // =====================================

            let customizationPrice = 0;

            const validatedCustomizations = [];

            const selectedOptions =
                item.selectedOptions || {};


            for (
                const groupName of Object.keys(
                    selectedOptions
                )
            ) {

                const selectedOption =
                    selectedOptions[groupName];


                const group =
                    food.customizations.find(
                        (customization) =>
                            customization.name ===
                            groupName
                    );


                if (!group) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `Invalid customization: ${groupName}`
                    });
                }


                const databaseOption =
                    group.options.find(
                        (option) =>
                            option.name ===
                            selectedOption.name
                    );


                if (!databaseOption) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `Invalid option: ${selectedOption.name}`
                    });
                }


                const optionPrice =
                    Number(
                        databaseOption.price || 0
                    );


                customizationPrice +=
                    optionPrice;


                validatedCustomizations.push({
                    name:
                        databaseOption.name,

                    price:
                        optionPrice
                });
            }


            // =====================================
            // ADD-ON PRICE
            // =====================================

            let addOnPrice = 0;

            const validatedAddOns = [];

            const selectedAddOns =
                item.selectedAddOns || [];


            for (
                const selectedAddOn of selectedAddOns
            ) {

                const databaseAddOn =
                    food.addOns.find(
                        (addOn) =>
                            addOn.name ===
                            selectedAddOn.name
                    );


                if (!databaseAddOn) {
                    return res.status(400).json({
                        success: false,
                        message:
                            `Invalid add-on: ${selectedAddOn.name}`
                    });
                }


                const currentAddOnPrice =
                    Number(
                        databaseAddOn.price || 0
                    );


                addOnPrice +=
                    currentAddOnPrice;


                validatedAddOns.push({
                    name:
                        databaseAddOn.name,

                    price:
                        currentAddOnPrice
                });
            }


            // =====================================
            // FINAL ITEM PRICE
            // =====================================

            const unitPrice =
                Number(food.price) +
                customizationPrice +
                addOnPrice;


            const itemTotal =
                unitPrice * quantity;


            subtotal += itemTotal;


            // =====================================
            // SAVE ITEM SNAPSHOT
            // =====================================

            orderItems.push({

                foodId:
                    food._id,

                name:
                    food.name,

                quantity,

                unitPrice,

                customizations:
                    validatedCustomizations,

                addOns:
                    validatedAddOns
            });
        }


        // =====================================
        // DELIVERY CHARGE
        // =====================================

        const deliveryCharge =
            subtotal >= 199
                ? 0
                : 30;


        // =====================================
        // GRAND TOTAL
        // =====================================

        const grandTotal =
            subtotal + deliveryCharge;


        // =====================================
        // ORDER NUMBER
        // =====================================

        const orderNumber =
            "ORD-" +
            Date.now() +
            "-" +
            Math.floor(
                1000 +
                Math.random() * 9000
            );


        // =====================================
        // RAZORPAY ORDER
        // =====================================

        let razorpayOrder = null;


        if (paymentMethod === "ONLINE") {

            razorpayOrder =
                await razorpay.orders.create({

                    amount:
                        Math.round(
                            grandTotal * 100
                        ),

                    currency:
                        "INR",

                    receipt:
                        `receipt_${Date.now()}`,

                    notes: {
                        customerName:
                            customer.name,

                        customerPhone:
                            customer.phone
                    }
                });
        }


        // =====================================
        // CREATE DATABASE ORDER
        // =====================================

        const order =
            await Order.create({

                userId:
                    req.user.id,

                orderNumber,

                customer,

                // IMPORTANT:
                // orderItems, NOT validatedItems
                items:
                    orderItems,

                subtotal,

                deliveryCharge,

                grandTotal,

                paymentMethod,

                paymentStatus:
                    paymentMethod === "ONLINE"
                        ? "PENDING"
                        : "PENDING",

                razorpayOrderId:
                    razorpayOrder?.id || ""
            });


        // =====================================
        // REAL-TIME ADMIN NOTIFICATION
        // =====================================

        const io =
            req.app.get("io");


        // COD:
        // Payment ki zarurat nahi,
        // isliye immediately admin ko bhejo.

        if (
            io &&
            paymentMethod === "COD"
        ) {

            io.to("admin_room").emit(
                "newOrder",
                order
            );


            console.log(
                "🔔 COD order sent to admin:",
                order.orderNumber
            );
        }


        // ONLINE:
        // Abhi payment pending hai.
        // Payment success ke baad admin ko notify karenge.


        // =====================================
        // RESPONSE
        // =====================================

        res.status(201).json({

            success: true,

            message:
                paymentMethod === "ONLINE"
                    ? "Order created. Complete payment."
                    : "Order placed successfully",

            order,

            payment:
                paymentMethod === "ONLINE"
                    ? {

                        key:
                            process.env
                                .RAZORPAY_KEY_ID,

                        razorpayOrderId:
                            razorpayOrder.id,

                        amount:
                            razorpayOrder.amount,

                        currency:
                            razorpayOrder.currency
                    }
                    : null
        });


    } catch (error) {

        console.error(
            "Create Order Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to create order",

            error:
                error.message
        });
    }
});


// =====================================
// GET MY ORDERS - CUSTOMER
// =====================================

router.get(
    "/my-orders",
    userAuth,
    async (req, res) => {

        try {

            const orders =
                await Order.find({
                    userId:
                        req.user.id
                }).sort({
                    createdAt: -1
                });


            res.status(200).json({

                success: true,

                count:
                    orders.length,

                orders
            });


        } catch (error) {

            console.error(
                "Get My Orders Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch your orders"
            });
        }
    }
);


// =====================================
// GET SINGLE ORDER - CUSTOMER
// =====================================

router.get(
    "/:id",
    userAuth,
    async (req, res) => {

        try {

            // =================================
            // VALIDATE ORDER ID
            // =================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.params.id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid order ID"
                });
            }


            // =================================
            // FIND ORDER
            // =================================

            const order =
                await Order.findOne({

                    _id:
                        req.params.id,

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


            res.status(200).json({

                success: true,

                order
            });


        } catch (error) {

            console.error(
                "Get Order Details Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch order details"
            });
        }
    }
);


// =====================================
// GET ALL ORDERS - ADMIN
// =====================================

router.get(
    "/",
    adminAuth,
    async (req, res) => {

        try {

            const orders =
                await Order.find()
                    .sort({
                        createdAt: -1
                    });


            res.status(200).json({

                success: true,

                count:
                    orders.length,

                orders
            });


        } catch (error) {

            console.error(
                "Get Orders Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to fetch orders"
            });
        }
    }
);


// =====================================
// UPDATE ORDER STATUS - ADMIN
// =====================================

router.patch(
    "/:id/status",
    adminAuth,
    async (req, res) => {

        try {

            const { status } =
                req.body;


            // =================================
            // ALLOWED STATUSES
            // =================================

            const allowedStatuses = [

                "PLACED",

                "CONFIRMED",

                "PREPARING",

                "READY",

                "OUT_FOR_DELIVERY",

                "DELIVERED",

                "CANCELLED"

            ];


            // =================================
            // VALIDATE STATUS
            // =================================

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid order status"
                });
            }


            // =================================
            // VALIDATE ORDER ID
            // =================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    req.params.id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid order ID"
                });
            }


            // =================================
            // UPDATE ORDER
            // =================================

            const order =
                await Order.findByIdAndUpdate(

                    req.params.id,

                    {
                        orderStatus:
                            status
                    },

                    {
                        new: true,

                        runValidators: true
                    }
                );


            if (!order) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order not found"
                });
            }


            // =====================================
            // SEND LIVE UPDATE TO CUSTOMER
            // =====================================

            const io =
                req.app.get("io");


            if (io) {

                io.to(
                    `order_${order._id}`
                ).emit(
                    "orderStatusUpdated",
                    {
                        orderId:
                            order._id,

                        orderNumber:
                            order.orderNumber,

                        status:
                            order.orderStatus
                    }
                );


                console.log(
                    "🔔 Customer status updated:",
                    order.orderNumber,
                    status
                );
            }


            // =====================================
            // RESPONSE
            // =====================================

            res.status(200).json({

                success: true,

                message:
                    "Order status updated",

                order
            });


        } catch (error) {

            console.error(
                "Update Order Status Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to update order status"
            });
        }
    }
);


module.exports = router;