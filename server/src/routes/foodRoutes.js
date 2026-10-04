const express = require("express");
const Food = require("../models/Food");
const Category = require("../models/category");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();


// ========================================
// GET ALL FOODS
// PUBLIC API
// ONLY ACTIVE CATEGORY FOODS
// ========================================

router.get("/", async (req, res) => {
    try {

        const { categoryId } = req.query;

        // ========================================
        // FIND ACTIVE CATEGORIES
        // ========================================

        const activeCategories = await Category.find({
            isActive: true
        }).select("_id");

        const activeCategoryIds =
            activeCategories.map(
                (category) => category._id
            );


        // ========================================
        // FOOD FILTER
        // ========================================

        let filter = {
            categoryId: {
                $in: activeCategoryIds
            }
        };


        // ========================================
        // SPECIFIC CATEGORY FILTER
        // ========================================

        if (categoryId) {

            // Agar requested category inactive hai
            // to koi food return nahi hoga

            const isActiveCategory =
                activeCategoryIds.some(
                    (id) =>
                        id.toString() ===
                        categoryId.toString()
                );

            if (!isActiveCategory) {

                return res.status(200).json({

                    success: true,

                    count: 0,

                    foods: []

                });
            }

            filter.categoryId = categoryId;
        }


        // ========================================
        // GET FOODS
        // ========================================

        const foods = await Food.find(filter)
            .populate(
                "categoryId",
                "name slug isActive"
            )
            .sort({
                createdAt: -1
            });


        // ========================================
        // RESPONSE
        // ========================================

        res.status(200).json({

            success: true,

            count: foods.length,

            foods

        });

    } catch (error) {

        console.log(
            "GET FOODS ERROR:",
            error
        );

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

            console.log(
                "CREATE FOOD ERROR:",
                error
            );

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

            console.log(
                "UPDATE FOOD ERROR:",
                error
            );

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

            console.log(
                "DELETE FOOD ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Food deleted successfully"

            });
        }

    }
);


