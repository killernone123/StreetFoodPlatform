const express = require("express");
const mongoose = require("mongoose");

const PushToken = require("../models/PushToken");
const {
    sendPushNotification
} = require("../utils/sendPushNotification");

const Order = require("../models/Order");
const Food = require("../models/Food");

const userAuth = require("../middleware/userAuth");
const adminAuth = require("../middleware/adminAuth");

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
        // VALIDATE ALL FOOD IDS
        // =====================================

        for (const item of items) {

            if (
                !item.foodId ||
                !mongoose.Types.ObjectId.isValid(
                    item.foodId
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid food ID"
                });

            }

        }


        // =====================================
        // GET FOOD IDS
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
            // FIND FOOD
            // =================================

            const food = foods.find(
                (foodItem) =>
                    foodItem._id.toString() ===
                    item.foodId.toString()
            );


            if (!food) {

                return res.status(404).json({
                    success: false,
                    message: "Food item not found"
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


                // -----------------------------
                // FIND CUSTOMIZATION GROUP
                // -----------------------------

                const group =
                    (food.customizations || []).find(
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


                // -----------------------------
                // VALIDATE SELECTED OPTION
                // -----------------------------

                const selectedOptionName =
                    selectedOption?.name;


                const databaseOption =
                    (group.options || []).find(
                        (option) =>
                            option.name ===
                            selectedOptionName
                    );


                if (!databaseOption) {

                    return res.status(400).json({
                        success: false,
                        message:
                            `Invalid option: ${selectedOptionName}`
                    });

                }


                // -----------------------------
                // OPTION PRICE
                // -----------------------------

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


            if (!Array.isArray(selectedAddOns)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid add-ons"
                });

            }


            for (
                const selectedAddOn of selectedAddOns
            ) {

                const databaseAddOn =
                    (food.addOns || []).find(
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
        // CREATE DATABASE ORDER
        // =====================================

        const order =
            await Order.create({

                userId:
                    req.user.id,

                orderNumber,

                customer,

                items:
                    orderItems,

                subtotal,

                deliveryCharge,

                grandTotal,

                paymentMethod,

                paymentStatus:
                    "PENDING",

                razorpayOrderId: ""

            });


        // =====================================
        // REAL-TIME ADMIN SOCKET
        // =====================================

        const io =
            req.app.get("io");


        // =====================================
        // COD ORDER
        // =====================================

        if (
            paymentMethod === "COD"
        ) {

            // =================================
            // SOCKET NOTIFICATION
            // =================================

            if (io) {

                io.to("admin_room").emit(
                    "newOrder",
                    order
                );


                console.log(
                    "🔔 COD order sent to admin socket:",
                    order.orderNumber
                );

            }


            // =================================
            // PUSH NOTIFICATION TO ADMIN
            // =================================

            try {

                const adminPushTokens =
                    await PushToken.find({

                        userType: "admin",

                        isActive: true,

                        token: {
                            $exists: true,
                            $ne: ""
                        }

                    });


                console.log(
                    "📱 ACTIVE ADMIN PUSH TOKENS:",
                    adminPushTokens.length
                );


                if (
                    adminPushTokens.length > 0
                ) {

                    const notificationPromises =
                        adminPushTokens.map(
                            async (pushToken) => {

                                return sendPushNotification({

                                    token:
                                        pushToken.token,

                                    title:
                                        "🔔 New Order Received",

                                    body:
                                        `${order.orderNumber} • ₹${order.grandTotal} • COD`,

                                    data: {

                                        type:
                                            "NEW_ORDER",

                                        orderId:
                                            order._id.toString(),

                                        orderNumber:
                                            order.orderNumber,

                                        paymentMethod:
                                            order.paymentMethod,

                                        grandTotal:
                                            order.grandTotal

                                    }

                                });

                            }
                        );


                    await Promise.all(
                        notificationPromises
                    );


                    console.log(
                        "✅ ADMIN PUSH NOTIFICATION SENT:",
                        order.orderNumber
                    );

                } else {

                    console.log(
                        "⚠️ No active admin push tokens found"
                    );

                }

            } catch (pushError) {

                console.error(
                    "❌ ADMIN PUSH NOTIFICATION ERROR:",
                    pushError
                );

                // Push notification fail hone par
                // order fail nahi hoga.
            }

        }


        // =====================================
        // ONLINE ORDER
        // =====================================
        //
        // Online payment ke case me:
        //
        // 1. Order database me create hoga
        // 2. Payment status PENDING rahega
        // 3. Mobile app /payments/create-order
        //    call karega
        // 4. Razorpay payment hoga
        // 5. /payments/verify payment verify karega
        // 6. Payment successful hone ke baad
        //    admin ko notification bhejna hai.
        //
        // Yahan notification NAHI bhej rahe.
        // Isse failed/cancelled payment par
        // admin ko fake new-order notification
        // nahi milegi.


        // =====================================
        // RESPONSE
        // =====================================

        return res.status(201).json({

            success: true,

            message:
                paymentMethod === "ONLINE"
                    ? "Order created. Complete payment."
                    : "Order placed successfully",

            order,

            payment: null

        });


    } catch (error) {

        console.error(
            "Create Order Error:",
            error
        );


        return res.status(500).json({

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


            return res.status(200).json({

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


            return res.status(500).json({

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


            return res.status(200).json({

                success: true,

                order

            });


        } catch (error) {

            console.error(
                "Get Order Details Error:",
                error
            );


            return res.status(500).json({

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


            return res.status(200).json({

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


            return res.status(500).json({

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

            const { status } = req.body;


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
                !allowedStatuses.includes(status)
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

                const roomName =
                    `order_${order._id.toString()}`;


                io.to(roomName).emit(

                    "orderStatusUpdated",

                    {

                        orderId:
                            order._id.toString(),

                        orderNumber:
                            order.orderNumber,

                        orderStatus:
                            order.orderStatus,

                        paymentStatus:
                            order.paymentStatus

                    }

                );


                console.log(
                    "🔔 LIVE STATUS SENT TO CUSTOMER"
                );

                console.log(
                    "📦 Order:",
                    order.orderNumber
                );

                console.log(
                    "📊 Status:",
                    order.orderStatus
                );

                console.log(
                    "🏠 Room:",
                    roomName
                );

                console.log(
                    "👥 Room clients:",
                    io.sockets
                        .adapter
                        .rooms
                        .get(roomName)
                        ?.size || 0
                );

            }


            // =====================================
            // RESPONSE
            // =====================================

            return res.status(200).json({

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


            return res.status(500).json({

                success: false,

                message:
                    "Failed to update order status"

            });

        }

    }
);


module.exports = router;