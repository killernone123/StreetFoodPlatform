const express = require("express");
const Support = require("../models/Support");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


// =====================================================
// CUSTOMER → SUBMIT FEEDBACK / COMPLAINT
// =====================================================

router.post("/", async (req, res) => {
    try {
        const {
            customerId,
            customerName,
            customerPhone,
            customerEmail,
            orderId,
            orderNumber,
            type,
            rating,
            subject,
            message,
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (!customerName || !customerName.trim()) {
            return res.status(400).json({
                success: false,
                message: "Customer name is required",
            });
        }


        if (!customerPhone || !customerPhone.trim()) {
            return res.status(400).json({
                success: false,
                message: "Customer phone is required",
            });
        }


        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Feedback message is required",
            });
        }


        if (
            rating !== undefined &&
            rating !== null &&
            (Number(rating) < 1 || Number(rating) > 5)
        ) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5",
            });
        }


        // =================================================
        // CREATE SUPPORT
        // =================================================

        const support = await Support.create({
            customerId:
                customerId || undefined,

            customerName:
                customerName.trim(),

            customerPhone:
                customerPhone.trim(),

            customerEmail:
                customerEmail
                    ? customerEmail.trim().toLowerCase()
                    : undefined,

            orderId:
                orderId || undefined,

            orderNumber:
                orderNumber
                    ? orderNumber.trim()
                    : undefined,

            type:
                type || "FEEDBACK",

            rating:
                rating !== undefined &&
                rating !== null
                    ? Number(rating)
                    : undefined,

            subject:
                subject
                    ? subject.trim()
                    : "Customer Feedback",

            message:
                message.trim(),

            status: "NEW",
        });


        // =================================================
        // RESPONSE
        // =================================================

        res.status(201).json({
            success: true,
            message:
                "Feedback submitted successfully",

            support: {
                id: support._id,
                customerName:
                    support.customerName,
                type:
                    support.type,
                rating:
                    support.rating,
                status:
                    support.status,
                createdAt:
                    support.createdAt,
            },
        });

    } catch (error) {

        console.log(
            "❌ CREATE SUPPORT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to submit feedback",
            error:
                error.message,
        });
    }
});


// =====================================================
// ADMIN → GET ALL FEEDBACKS
// =====================================================

router.get("/", adminAuth, async (req, res) => {
    try {

        const supports =
            await Support.find()
                .sort({
                    createdAt: -1,
                });


        res.status(200).json({
            success: true,
            count: supports.length,
            supports,
        });

    } catch (error) {

        console.log(
            "❌ GET SUPPORT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to fetch feedbacks",
            error:
                error.message,
        });
    }
});


// =====================================================
// ADMIN → GET SINGLE FEEDBACK
// =====================================================

router.get(
    "/:id",
    adminAuth,
    async (req, res) => {
        try {

            const support =
                await Support.findById(
                    req.params.id
                );


            if (!support) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Feedback not found",
                });
            }


            res.status(200).json({
                success: true,
                support,
            });

        } catch (error) {

            console.log(
                "❌ GET SINGLE SUPPORT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to fetch feedback",
                error:
                    error.message,
            });
        }
    }
);


// =====================================================
// ADMIN → UPDATE STATUS
// =====================================================

router.put(
    "/:id/status",
    adminAuth,
    async (req, res) => {
        try {

            const {
                status,
                adminReply,
            } = req.body;


            const allowedStatuses = [
                "NEW",
                "READ",
                "RESOLVED",
            ];


            if (
                !status ||
                !allowedStatuses.includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid status",
                });
            }


            const updateData = {
                status,
            };


            if (
                adminReply !== undefined
            ) {
                updateData.adminReply =
                    adminReply;
            }


            if (status === "RESOLVED") {
                updateData.resolvedAt =
                    new Date();
            } else {
                updateData.resolvedAt =
                    undefined;
            }


            const support =
                await Support.findByIdAndUpdate(
                    req.params.id,
                    updateData,
                    {
                        new: true,
                        runValidators: true,
                    }
                );


            if (!support) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Feedback not found",
                });
            }


            res.status(200).json({
                success: true,
                message:
                    "Feedback status updated",
                support,
            });

        } catch (error) {

            console.log(
                "❌ UPDATE SUPPORT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to update feedback",
                error:
                    error.message,
            });
        }
    }
);


// =====================================================
// ADMIN → DELETE FEEDBACK
// =====================================================

router.delete(
    "/:id",
    adminAuth,
    async (req, res) => {
        try {

            const support =
                await Support.findByIdAndDelete(
                    req.params.id
                );


            if (!support) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Feedback not found",
                });
            }


            res.status(200).json({
                success: true,
                message:
                    "Feedback deleted successfully",
            });

        } catch (error) {

            console.log(
                "❌ DELETE SUPPORT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to delete feedback",
                error:
                    error.message,
            });
        }
    }
);


module.exports = router;