const express = require("express");
const Food = require("../models/Food");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


// ========================================
// GET ALL FOODS
// Public API
// ========================================

router.get("/", async (req, res) => {

    try {

        const { categoryId } = req.query;

        let filter = {};

        if (categoryId) {
            filter.categoryId = categoryId;
        }

        const foods = await Food.find(filter)
            .populate(
                "categoryId",
                "name slug"
            )
            .sort({
                createdAt: -1
            });

        res.status(200).json({

            success: true,

            count: foods.length,

            foods

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });
    }
});


// ========================================
// ADD FOOD
// ADMIN ONLY
// ========================================

router.post(
    "/",
    adminAuth,
    async (req, res) => {

        try {

            const food = await Food.create(
                req.body
            );

            res.status(201).json({

                success: true,

                message:
                    "Food created successfully",

                food

            });

        } catch (error) {

            res.status(500).json({

                success: false,

                message: error.message

            });
        }
    }
);


// ========================================
// UPDATE FOOD
// ADMIN ONLY
// ========================================

router.put(
    "/:id",
    adminAuth,
    async (req, res) => {

        try {

            const food =
                await Food.findByIdAndUpdate(
                    req.params.id,
                    req.body,
                    {
                        new: true,
                        runValidators: true
                    }
                );

            if (!food) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Food not found"

                });
            }

            res.status(200).json({

                success: true,

                message:
                    "Food updated successfully",

                food

            });

        } catch (error) {

            res.status(500).json({

                success: false,

                message: error.message

            });
        }
    }
);


// ========================================
// DELETE FOOD
// ADMIN ONLY
// ========================================

router.delete(
    "/:id",
    adminAuth,
    async (req, res) => {

        try {

            const food =
                await Food.findByIdAndDelete(
                    req.params.id
                );

            if (!food) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Food not found"

                });
            }

            res.status(200).json({

                success: true,

                message:
                    "Food deleted successfully"

            });

        } catch (error) {

            res.status(500).json({

                success: false,

                message: error.message

            });
        }
    }
);


module.exports = router;