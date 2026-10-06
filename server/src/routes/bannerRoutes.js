const express = require("express");

const Banner = require("../models/Banner");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| ADMIN - GET ALL BANNERS
|--------------------------------------------------------------------------
*/

router.get("/", adminAuth, async (req, res) => {
    try {
        const banners = await Banner.find()
            .sort({
                sortOrder: 1,
                createdAt: -1,
            });

        res.json({
            success: true,
            count: banners.length,
            banners,
        });
    } catch (error) {
        console.error(
            "GET BANNERS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch banners",
        });
    }
});

/*
|--------------------------------------------------------------------------
| CUSTOMER - GET ACTIVE BANNERS
|--------------------------------------------------------------------------
*/

router.get("/active", async (req, res) => {
    try {
        const now = new Date();

        const banners = await Banner.find({
            isActive: true,

            $and: [
                {
                    $or: [
                        {
                            startDate: null,
                        },
                        {
                            startDate: {
                                $lte: now,
                            },
                        },
                    ],
                },

                {
                    $or: [
                        {
                            endDate: null,
                        },
                        {
                            endDate: {
                                $gte: now,
                            },
                        },
                    ],
                },
            ],
        }).sort({
            sortOrder: 1,
            createdAt: -1,
        });

        res.json({
            success: true,
            count: banners.length,
            banners,
        });
    } catch (error) {
        console.error(
            "GET ACTIVE BANNERS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch active banners",
        });
    }
});

/*
|--------------------------------------------------------------------------
| ADMIN - CREATE BANNER
|--------------------------------------------------------------------------
*/

router.post("/", adminAuth, async (req, res) => {
    try {
        const {
            title,
            message,
            image,
            type,
            isActive,
            startDate,
            endDate,
            sortOrder,
        } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Banner title is required",
            });
        }

        const banner = await Banner.create({
            title: title.trim(),
            message: message?.trim() || "",
            image: image?.trim() || "",
            type: type || "general",
            isActive:
                isActive !== undefined
                    ? Boolean(isActive)
                    : true,
            startDate:
                startDate || null,
            endDate:
                endDate || null,
            sortOrder:
                Number(sortOrder) || 0,
        });

        res.status(201).json({
            success: true,
            message: "Banner created successfully",
            banner,
        });
    } catch (error) {
        console.error(
            "CREATE BANNER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to create banner",
        });
    }
});

/*
|--------------------------------------------------------------------------
| ADMIN - UPDATE BANNER
|--------------------------------------------------------------------------
*/

router.put("/:id", adminAuth, async (req, res) => {
    try {
        const {
            title,
            message,
            image,
            type,
            isActive,
            startDate,
            endDate,
            sortOrder,
        } = req.body;

        const banner =
            await Banner.findById(
                req.params.id
            );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        if (title !== undefined) {
            banner.title =
                title.trim();
        }

        if (message !== undefined) {
            banner.message =
                message.trim();
        }

        if (image !== undefined) {
            banner.image =
                image.trim();
        }

        if (type !== undefined) {
            banner.type = type;
        }

        if (isActive !== undefined) {
            banner.isActive =
                Boolean(isActive);
        }

        if (startDate !== undefined) {
            banner.startDate =
                startDate || null;
        }

        if (endDate !== undefined) {
            banner.endDate =
                endDate || null;
        }

        if (sortOrder !== undefined) {
            banner.sortOrder =
                Number(sortOrder) || 0;
        }

        await banner.save();

        res.json({
            success: true,
            message: "Banner updated successfully",
            banner,
        });
    } catch (error) {
        console.error(
            "UPDATE BANNER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to update banner",
        });
    }
});

/*
|--------------------------------------------------------------------------
| ADMIN - DELETE BANNER
|--------------------------------------------------------------------------
*/

router.delete("/:id", adminAuth, async (req, res) => {
    try {
        const banner =
            await Banner.findByIdAndDelete(
                req.params.id
            );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: "Banner not found",
            });
        }

        res.json({
            success: true,
            message: "Banner deleted successfully",
        });
    } catch (error) {
        console.error(
            "DELETE BANNER ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to delete banner",
        });
    }
});

module.exports = router;